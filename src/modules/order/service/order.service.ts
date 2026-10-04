import {
  BadGatewayException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { paginate } from 'nestjs-typeorm-paginate';
import { DataSource, FindOptionsWhere, LessThan, Repository } from 'typeorm';
import { PaginationParser } from 'src/common/parser/pagination.parser';
import { fromCents, toCents } from 'src/common/helpers/money';
import { StripeService } from 'src/integrations/stripe/stripe.service';
import { Cart, CartStatus } from 'src/modules/cart/domain/entity/cart.entity';
import { CartItem } from 'src/modules/cart/domain/entity/cart-item.entity';
import {
  allocateCents,
  computeTotals,
  eligibleSubtotalCents,
} from 'src/modules/cart/cart-pricing';
import { Coupon } from 'src/modules/coupon/domain/entity/coupon.entity';
import { assertCouponUsable } from 'src/modules/coupon/helpers/coupon-usage';
import { ProductVariant } from 'src/modules/product/domain/entity/product-variant.entity';
import { User } from 'src/modules/user/domain/entity/user.entity';
import { Order, OrderStatus } from '../domain/entity/order.entity';
import { OrderItem } from '../domain/entity/order-item.entity';

export interface MarkPaidParams {
  orderId: number;
  paymentIntentId: string;
  amountCents: number;
  currency: string;
}

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);
  private readonly currency: string;

  constructor(
    @InjectRepository(Order) private readonly orderRepo: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly itemRepo: Repository<OrderItem>,
    @InjectRepository(Cart) private readonly cartRepo: Repository<Cart>,
    @InjectRepository(CartItem)
    private readonly cartItemRepo: Repository<CartItem>,
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly stripe: StripeService,
    config: ConfigService,
  ) {
    this.currency = (
      config.get<string>('STRIPE_CURRENCY') ?? 'usd'
    ).toLowerCase();
  }

  /* ------------------------------- checkout ------------------------------- */

  /**
   * 1. Valida el carrito (no comprar lo propio, stock, precios, cupón).
   * 2. En una transacción: marca el carrito como `converted`, descuenta el
   *    stock de forma atómica y crea el pedido en `pending_payment`.
   * 3. Crea el PaymentIntent en Stripe. Si falla, revierte todo.
   * El pedido pasa a `paid` cuando llega el webhook payment_intent.succeeded.
   */
  async checkout(
    user: User,
  ): Promise<{ order: Order; clientSecret: string | null }> {
    const cart = await this.cartRepo.findOne({
      where: { user: { id: user.id }, status: CartStatus.ACTIVE },
      relations: {
        items: { productVariant: { product: { seller: true } } },
        coupons: { coupon: { seller: true } },
      },
    });
    if (!cart || cart.items.length === 0)
      throw new BadRequestException('El carrito está vacío');

    for (const item of cart.items) {
      const product = item.productVariant?.product;
      if (!product)
        throw new ConflictException(
          'Un producto de tu carrito ya no está disponible',
        );
      if (product.seller.id === user.id)
        throw new ForbiddenException('No puedes comprar tus propios productos');
    }

    const staleItems = cart.items.filter(
      (item) =>
        toCents(item.productVariant.price) !== toCents(item.priceAtAddition),
    );
    if (staleItems.length) {
      await Promise.all(
        staleItems.map((item) =>
          this.cartItemRepo.update(item.id, {
            priceAtAddition: item.productVariant.price,
          }),
        ),
      );
      throw new ConflictException(
        'El precio de algunos productos cambió. Revisa tu carrito antes de pagar.',
      );
    }

    let coupon: Coupon | null = null;
    if (cart.coupons.length) {
      coupon = cart.coupons[0].coupon ?? null;
      if (!coupon || coupon.expirationDate.getTime() <= Date.now())
        throw new ConflictException(
          'El cupón del carrito ya no es válido. Quítalo para continuar.',
        );
    }

    const lines = cart.items.map((i) => ({
      unitPrice: i.priceAtAddition,
      quantity: i.quantity,
      sellerId: i.productVariant.product.seller.id,
    }));
    const rule = coupon ? { ...coupon, sellerId: coupon.seller?.id } : null;
    if (rule && eligibleSubtotalCents(lines, rule) <= 0)
      throw new ConflictException(
        'El cupón no aplica a los productos de tu carrito. Quítalo para continuar.',
      );
    const totals = computeTotals(lines, rule);

    // Cupón de vendedor: el descuento lo asume ese vendedor, repartido entre
    // sus líneas para que sus ventas muestren el importe neto.
    const lineDiscountCents = new Map<number, number>();
    if (coupon?.seller && totals.discountCents > 0) {
      const sellerId = coupon.seller.id;
      const own = cart.items.filter(
        (i) => i.productVariant.product.seller.id === sellerId,
      );
      const shares = allocateCents(
        own.map((i) => toCents(i.priceAtAddition) * i.quantity),
        totals.discountCents,
      );
      own.forEach((item, index) =>
        lineDiscountCents.set(item.id, shares[index]),
      );
    }

    const orderId = await this.dataSource.transaction(async (manager) => {
      // Bloquea el cupón: los checkouts concurrentes con el mismo cupón se
      // serializan, así los límites de uso no se pueden superar por carrera.
      if (coupon) {
        const locked = await manager.findOne(Coupon, {
          where: { id: coupon.id },
          lock: { mode: 'pessimistic_write' },
        });
        if (!locked || locked.expirationDate.getTime() <= Date.now())
          throw new ConflictException(
            'El cupón del carrito ya no es válido. Quítalo para continuar.',
          );
        if (
          locked.discountType !== coupon.discountType ||
          locked.discountValue !== coupon.discountValue
        )
          throw new ConflictException(
            'El cupón cambió. Revisa tu carrito antes de pagar.',
          );
        await assertCouponUsable(manager, locked, user.id);
      }

      // evita doble checkout concurrente del mismo carrito
      const converted = await manager.update(
        Cart,
        { id: cart.id, status: CartStatus.ACTIVE },
        { status: CartStatus.CONVERTED },
      );
      if (!converted.affected)
        throw new ConflictException('El carrito ya fue procesado');

      // orden fijo por id para evitar deadlocks entre checkouts concurrentes
      const sorted = [...cart.items].sort(
        (a, b) => a.productVariant.id - b.productVariant.id,
      );
      for (const item of sorted) {
        const quantity = Math.trunc(item.quantity);
        // descuento atómico: solo si hay stock y el precio no cambió
        const result = await manager
          .createQueryBuilder()
          .update(ProductVariant)
          .set({ stockQuantity: () => `"stockQuantity" - ${quantity}` })
          .where(
            'id = :id AND "stockQuantity" >= :quantity AND price = :price',
            {
              id: item.productVariant.id,
              quantity,
              price: item.priceAtAddition,
            },
          )
          .execute();
        if (!result.affected)
          throw new ConflictException(
            `Stock insuficiente o precio modificado para "${item.productVariant.sku}"`,
          );
      }

      const order = await manager.save(
        Order,
        manager.create(Order, {
          buyer: { id: user.id },
          cart: { id: cart.id },
          status: OrderStatus.PENDING_PAYMENT,
          subtotal: fromCents(totals.subtotalCents),
          discountTotal: fromCents(totals.discountCents),
          total: fromCents(totals.totalCents),
          currency: this.currency,
          coupon: coupon ? { id: coupon.id } : null,
          couponCode: coupon?.code ?? null,
        }),
      );

      await manager.save(
        OrderItem,
        sorted.map((item) =>
          manager.create(OrderItem, {
            order: { id: order.id },
            productVariant: { id: item.productVariant.id },
            seller: { id: item.productVariant.product.seller.id },
            productName: item.productVariant.product.name,
            sku: item.productVariant.sku,
            attributes: item.productVariant.attributes,
            quantity: item.quantity,
            unitPrice: item.priceAtAddition,
            discountAmount: fromCents(lineDiscountCents.get(item.id) ?? 0),
          }),
        ),
      );

      return order.id;
    });

    // Total 0 (cupón del 100%): no hay nada que cobrar
    if (totals.totalCents === 0) {
      await this.orderRepo.update(orderId, {
        status: OrderStatus.PAID,
        paidAt: new Date(),
      });
      return {
        order: await this.findOneOwned(orderId, user.id),
        clientSecret: null,
      };
    }

    try {
      const intent = await this.stripe.createPaymentIntent({
        amountCents: totals.totalCents,
        currency: this.currency,
        orderId,
        userId: user.id,
        idempotencyKey: `order-${orderId}-payment-intent`,
      });
      await this.orderRepo.update(orderId, {
        stripePaymentIntentId: intent.id,
      });
      return {
        order: await this.findOneOwned(orderId, user.id),
        clientSecret: intent.client_secret,
      };
    } catch (err) {
      this.logger.error(
        `No se pudo crear el pago del pedido ${orderId}: ${String(err)}`,
      );
      await this.cancelLocally(orderId).catch((e) =>
        this.logger.error(
          `No se pudo revertir el pedido ${orderId}: ${String(e)}`,
        ),
      );
      if (err instanceof HttpException) throw err;
      throw new BadGatewayException(
        'No se pudo iniciar el pago. Intenta de nuevo.',
      );
    }
  }

  /* ----------------------------- cambios de estado ----------------------------- */

  /**
   * Idempotente: solo transiciona desde `pending_payment`. Si el pago llega
   * cuando el pedido ya estaba cancelado (carrera con la expiración), se
   * reembolsa automáticamente.
   */
  async markPaid(params: MarkPaidParams): Promise<void> {
    const order = await this.orderRepo.findOne({
      where: { id: params.orderId },
    });
    if (!order) {
      this.logger.warn(
        `Pago ${params.paymentIntentId}: pedido ${params.orderId} no existe`,
      );
      return;
    }

    if (
      toCents(order.total) !== params.amountCents ||
      order.currency !== params.currency.toLowerCase()
    ) {
      this.logger.error(
        `Pago ${params.paymentIntentId} no coincide con el pedido ${order.id} (esperado ${toCents(order.total)} ${order.currency}, recibido ${params.amountCents} ${params.currency}). Requiere revisión manual.`,
      );
      return;
    }

    const result = await this.orderRepo.update(
      { id: order.id, status: OrderStatus.PENDING_PAYMENT },
      {
        status: OrderStatus.PAID,
        paidAt: new Date(),
        stripePaymentIntentId: params.paymentIntentId,
      },
    );
    if (result.affected) {
      this.logger.log(`Pedido ${order.id} pagado (${params.paymentIntentId})`);
      return;
    }

    if (order.status === OrderStatus.CANCELLED) {
      this.logger.warn(
        `Pago recibido para el pedido cancelado ${order.id}: reembolsando`,
      );
      await this.stripe.refundPaymentIntent(
        params.paymentIntentId,
        `order-${order.id}-late-payment-refund`,
      );
    }
    // status PAID => evento duplicado, no hay nada que hacer
  }

  /** Cancela localmente: libera el stock y reactiva el carrito. Idempotente. */
  async cancelLocally(orderId: number): Promise<boolean> {
    const cancelled = await this.dataSource.transaction(async (manager) => {
      const result = await manager.update(
        Order,
        { id: orderId, status: OrderStatus.PENDING_PAYMENT },
        { status: OrderStatus.CANCELLED },
      );
      if (!result.affected) return false;

      const items = await manager.find(OrderItem, {
        where: { order: { id: orderId } },
        relations: { productVariant: true },
      });
      for (const item of items) {
        if (item.productVariant)
          await manager.increment(
            ProductVariant,
            { id: item.productVariant.id },
            'stockQuantity',
            item.quantity,
          );
      }
      return true;
    });

    if (cancelled) await this.reactivateCart(orderId);
    return cancelled;
  }

  /** Devuelve el carrito al usuario si no creó otro activo mientras tanto */
  private async reactivateCart(orderId: number): Promise<void> {
    try {
      const order = await this.orderRepo.findOne({
        where: { id: orderId },
        relations: { cart: true },
      });
      if (!order?.cart) return;
      await this.dataSource.query(
        `UPDATE "carts" SET "status" = 'active', "updatedAt" = now()
         WHERE "id" = $1 AND "status" = 'converted'
           AND NOT EXISTS (
             SELECT 1 FROM "carts" c2
             WHERE c2."user_id" = "carts"."user_id" AND c2."status" = 'active'
           )`,
        [order.cart.id],
      );
    } catch (err) {
      this.logger.warn(
        `No se pudo reactivar el carrito del pedido ${orderId}: ${String(err)}`,
      );
    }
  }

  /** Cancela el pago en Stripe (si existe) y luego el pedido */
  async cancelPending(order: Order): Promise<void> {
    if (order.stripePaymentIntentId) {
      try {
        await this.stripe.cancelPaymentIntent(order.stripePaymentIntentId);
      } catch (err) {
        const intent = await this.stripe
          .retrievePaymentIntent(order.stripePaymentIntentId)
          .catch(() => null);

        if (intent?.status === 'succeeded') {
          await this.markPaid({
            orderId: order.id,
            paymentIntentId: intent.id,
            amountCents: intent.amount_received,
            currency: intent.currency,
          });
          throw new ConflictException('El pago ya fue completado');
        }
        if (intent?.status !== 'canceled') {
          this.logger.error(
            `No se pudo cancelar el pago del pedido ${order.id}: ${String(err)}`,
          );
          throw new ConflictException(
            'No se pudo cancelar el pago en este momento. Intenta de nuevo.',
          );
        }
      }
    }
    await this.cancelLocally(order.id);
  }

  async cancelByBuyer(orderId: number, userId: number): Promise<Order> {
    const order = await this.findOneOwned(orderId, userId);
    if (order.status !== OrderStatus.PENDING_PAYMENT)
      throw new ConflictException(
        'Solo se pueden cancelar pedidos pendientes de pago',
      );
    await this.cancelPending(order);
    return this.findOneOwned(orderId, userId);
  }

  /** Cancela pedidos sin pagar que superaron el tiempo máximo (job) */
  async expirePendingOrders(
    olderThan: Date,
  ): Promise<{ scanned: number; cancelled: number; failed: number }> {
    const expired = await this.orderRepo.find({
      where: {
        status: OrderStatus.PENDING_PAYMENT,
        createdAt: LessThan(olderThan),
      },
      select: { id: true, stripePaymentIntentId: true, status: true },
    });

    let cancelled = 0;
    let failed = 0;
    for (const order of expired) {
      try {
        await this.cancelPending(order);
        cancelled += 1;
      } catch (err) {
        failed += 1;
        this.logger.warn(
          `No se pudo expirar el pedido ${order.id}: ${String(err)}`,
        );
      }
    }
    return { scanned: expired.length, cancelled, failed };
  }

  /* -------------------------------- consultas -------------------------------- */

  async findOneOwned(id: number, userId: number): Promise<Order> {
    const order = await this.orderRepo.findOne({
      where: { id, buyer: { id: userId } },
      relations: { items: { productVariant: true } },
    });
    if (!order) throw new NotFoundException('Pedido no encontrado');
    return order;
  }

  async findMine(params: {
    userId: number;
    status?: OrderStatus;
    page: number;
    size: number;
  }): Promise<PaginationParser<Order>> {
    const where: FindOptionsWhere<Order> = { buyer: { id: params.userId } };
    if (params.status) where.status = params.status;

    const result = await paginate<Order>(
      this.orderRepo,
      { page: params.page, limit: params.size },
      {
        where,
        relations: { items: { productVariant: true } },
        order: { id: 'DESC' },
      },
    );
    return new PaginationParser(result);
  }

  /** Items vendidos por el usuario en pedidos ya pagados */
  async findSales(params: {
    sellerId: number;
    page: number;
    size: number;
  }): Promise<PaginationParser<OrderItem>> {
    const result = await paginate<OrderItem>(
      this.itemRepo,
      { page: params.page, limit: params.size },
      {
        where: {
          seller: { id: params.sellerId },
          order: { status: OrderStatus.PAID },
        },
        relations: { order: { buyer: true }, productVariant: true },
        order: { id: 'DESC' },
      },
    );
    return new PaginationParser(result);
  }
}
