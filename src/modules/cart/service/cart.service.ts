import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import {
  DataSource,
  FindOptionsRelations,
  QueryFailedError,
  Repository,
} from 'typeorm';
import { CouponService } from 'src/modules/coupon/service/coupon.service';
import { ProductVariant } from 'src/modules/product/domain/entity/product-variant.entity';
import { Cart, CartStatus } from '../domain/entity/cart.entity';
import { CartItem } from '../domain/entity/cart-item.entity';
import { CartCoupon } from '../domain/entity/cart-coupon.entity';
import { AddCartItemDto, MAX_ITEM_QUANTITY } from '../domain/dto/payload.dto';

export const CART_RELATIONS: FindOptionsRelations<Cart> = {
  items: {
    productVariant: { product: { seller: true, images: { upload: true } } },
  },
  coupons: { coupon: true },
};

const isUniqueViolation = (err: unknown): boolean =>
  err instanceof QueryFailedError &&
  (err.driverError as { code?: string } | undefined)?.code === '23505';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart) private readonly repo: Repository<Cart>,
    @InjectRepository(CartItem)
    private readonly itemRepo: Repository<CartItem>,
    @InjectRepository(ProductVariant)
    private readonly variantRepo: Repository<ProductVariant>,
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly couponService: CouponService,
  ) {}

  /** Carrito activo del usuario; lo crea si no existe */
  async getOrCreateActive(userId: number): Promise<Cart> {
    const where = { user: { id: userId }, status: CartStatus.ACTIVE };

    const existing = await this.repo.findOne({
      where,
      relations: CART_RELATIONS,
    });
    if (existing) return existing;

    try {
      await this.repo.save(
        this.repo.create({ user: { id: userId }, status: CartStatus.ACTIVE }),
      );
    } catch (err) {
      // otra petición lo creó al mismo tiempo (índice único parcial)
      if (!isUniqueViolation(err)) throw err;
    }

    return this.repo.findOneOrFail({ where, relations: CART_RELATIONS });
  }

  async addItem(userId: number, dto: AddCartItemDto): Promise<Cart> {
    const variant = await this.variantRepo.findOne({
      where: { id: dto.productVariant.id },
      relations: { product: { seller: true } },
    });
    if (!variant?.product) throw new NotFoundException('La variante no existe');

    if (variant.product.seller.id === userId)
      throw new ForbiddenException('No puedes comprar tus propios productos');

    const cart = await this.getOrCreateActive(userId);
    const existing = cart.items.find(
      (item) => item.productVariant.id === variant.id,
    );

    const quantity = (existing?.quantity ?? 0) + dto.quantity;
    if (quantity > MAX_ITEM_QUANTITY)
      throw new BadRequestException(
        `Máximo ${MAX_ITEM_QUANTITY} unidades por producto`,
      );
    if (quantity > variant.stockQuantity)
      throw new ConflictException(
        `Stock insuficiente (disponible: ${variant.stockQuantity})`,
      );

    if (existing) {
      existing.quantity = quantity;
      existing.priceAtAddition = variant.price;
      await this.itemRepo.save(existing);
    } else {
      await this.itemRepo.save(
        this.itemRepo.create({
          cart: { id: cart.id },
          productVariant: { id: variant.id },
          quantity,
          priceAtAddition: variant.price,
        }),
      );
    }

    return this.getOrCreateActive(userId);
  }

  private async findOwnItem(userId: number, itemId: number): Promise<CartItem> {
    const item = await this.itemRepo.findOne({
      where: {
        id: itemId,
        cart: { user: { id: userId }, status: CartStatus.ACTIVE },
      },
      relations: { productVariant: true },
    });
    if (!item) throw new NotFoundException('El item no existe en tu carrito');
    return item;
  }

  async updateItemQuantity(
    userId: number,
    itemId: number,
    quantity: number,
  ): Promise<Cart> {
    const item = await this.findOwnItem(userId, itemId);
    if (quantity > item.productVariant.stockQuantity)
      throw new ConflictException(
        `Stock insuficiente (disponible: ${item.productVariant.stockQuantity})`,
      );

    item.quantity = quantity;
    item.priceAtAddition = item.productVariant.price;
    await this.itemRepo.save(item);
    return this.getOrCreateActive(userId);
  }

  async removeItem(userId: number, itemId: number): Promise<Cart> {
    const item = await this.findOwnItem(userId, itemId);
    await this.itemRepo.delete(item.id);
    return this.getOrCreateActive(userId);
  }

  async clear(userId: number): Promise<Cart> {
    const cart = await this.getOrCreateActive(userId);
    await this.dataSource.transaction(async (manager) => {
      await manager.delete(CartItem, { cart: { id: cart.id } });
      await manager.delete(CartCoupon, { cartId: cart.id });
    });
    return this.getOrCreateActive(userId);
  }

  /** Un carrito aplica un único cupón: aplicar otro reemplaza el anterior */
  async applyCoupon(userId: number, code: string): Promise<Cart> {
    const cart = await this.getOrCreateActive(userId);
    const coupon = await this.couponService.findValidByCode(code);

    await this.dataSource.transaction(async (manager) => {
      await manager.delete(CartCoupon, { cartId: cart.id });
      await manager.insert(CartCoupon, {
        cartId: cart.id,
        couponId: coupon.id,
      });
    });
    return this.getOrCreateActive(userId);
  }

  async removeCoupon(userId: number): Promise<Cart> {
    const cart = await this.getOrCreateActive(userId);
    await this.dataSource.manager.delete(CartCoupon, { cartId: cart.id });
    return this.getOrCreateActive(userId);
  }
}
