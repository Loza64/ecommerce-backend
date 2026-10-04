import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { paginate } from 'nestjs-typeorm-paginate';
import {
  FindOptionsOrder,
  FindOptionsRelations,
  FindOptionsWhere,
  Repository,
} from 'typeorm';
import { ICrudService } from 'src/common/service/crud.service';
import { PaginationParser } from 'src/common/parser/pagination.parser';
import { Coupon, DiscountType } from '../domain/entity/coupon.entity';
import { CreateCouponDto, UpdateCouponDto } from '../domain/dto/payload.dto';
import { countUsesByCoupon } from '../helpers/coupon-usage';
import { UserService } from 'src/modules/user/service/user.service';

const SELLER_RELATION: FindOptionsRelations<Coupon> = { seller: true };

interface CouponRules {
  discountType: DiscountType;
  discountValue: number;
  expirationDate: Date;
  maxUses?: number | null;
  maxUsesPerUser?: number | null;
}

@Injectable()
export class CouponService implements ICrudService<
  Coupon,
  CreateCouponDto,
  UpdateCouponDto
> {
  constructor(
    @InjectRepository(Coupon) private readonly repo: Repository<Coupon>,
    private readonly userService: UserService,
  ) {}

  private assertValid(coupon: CouponRules, checkFuture: boolean): void {
    if (
      coupon.discountType === DiscountType.PERCENTAGE &&
      coupon.discountValue > 100
    )
      throw new BadRequestException(
        'El descuento porcentual no puede superar 100',
      );
    if (checkFuture && coupon.expirationDate.getTime() <= Date.now())
      throw new BadRequestException('La fecha de expiración debe ser futura');
    if (
      coupon.maxUses &&
      coupon.maxUsesPerUser &&
      coupon.maxUsesPerUser > coupon.maxUses
    )
      throw new BadRequestException(
        'El límite por usuario no puede superar el límite total de usos',
      );
  }

  private async assertCodeAvailable(
    code: string,
    selfId?: number,
  ): Promise<void> {
    const existing = await this.repo.findOne({ where: { code } });
    if (existing && existing.id !== selfId)
      throw new ConflictException(`El cupón "${code}" ya existe`);
  }

  /** Filtro de propiedad: con `sellerId` solo se ve/edita lo propio */
  private scoped(id: number, sellerId?: number): FindOptionsWhere<Coupon> {
    return sellerId ? { id, sellerId } : { id };
  }

  /** Usos (pedidos pendientes o pagados) por cupón */
  usesByCoupon(couponIds: number[]): Promise<Map<number, number>> {
    return countUsesByCoupon(this.repo.manager, couponIds);
  }

  async usesOf(couponId: number): Promise<number> {
    return (await this.usesByCoupon([couponId])).get(couponId) ?? 0;
  }

  /** Sin `sellerId` crea un cupón de la plataforma */
  async create(data: CreateCouponDto, sellerId?: number): Promise<Coupon> {
    this.assertValid(data, true);
    await this.assertCodeAvailable(data.code);
    const seller = sellerId
      ? await this.userService.findOneBy({
          filters: { id: sellerId },
          relations: { role: { permissions: true } },
        })
      : undefined;
    const saved = await this.repo.save(
      this.repo.create({
        ...data,
        maxUses: data.maxUses ?? null,
        maxUsesPerUser: data.maxUsesPerUser ?? null,
        seller,
      }),
    );
    return this.findOneBy({ filters: { id: saved.id } });
  }

  async update({
    id,
    data,
    sellerId,
  }: {
    id: number;
    data: UpdateCouponDto;
    sellerId?: number;
  }): Promise<Coupon> {
    const coupon = await this.findOneBy({ filters: this.scoped(id, sellerId) });
    Object.assign(coupon, data);
    this.assertValid(coupon, data.expirationDate !== undefined);
    if (data.code) await this.assertCodeAvailable(coupon.code, id);
    await this.repo.save(coupon);
    return this.findOneBy({ filters: { id } });
  }

  async delete(id: number): Promise<Coupon> {
    const coupon = await this.findOneBy({ filters: { id } });
    await this.repo.remove(coupon);
    return coupon;
  }

  async softDelete(id: number, sellerId?: number): Promise<Coupon> {
    await this.findOneBy({ filters: this.scoped(id, sellerId) });
    await this.repo.softDelete(id);
    return this.repo.findOneOrFail({
      where: { id },
      relations: SELLER_RELATION,
      withDeleted: true,
    });
  }

  async softRestore(id: number, sellerId?: number): Promise<Coupon> {
    const coupon = await this.repo.findOne({
      where: this.scoped(id, sellerId),
      withDeleted: true,
    });
    if (!coupon) throw new NotFoundException(`Cupón ${id} no existe`);
    await this.assertCodeAvailable(coupon.code, id);
    await this.repo.restore(id);
    return this.repo.findOneOrFail({
      where: { id },
      relations: SELLER_RELATION,
    });
  }

  /** Cupón vigente (no eliminado y no expirado) por código, con su vendedor */
  async findValidByCode(code: string): Promise<Coupon> {
    const coupon = await this.repo.findOne({
      where: { code },
      relations: SELLER_RELATION,
    });
    if (!coupon) throw new NotFoundException('El cupón no existe');
    if (coupon.expirationDate.getTime() <= Date.now())
      throw new BadRequestException('El cupón ha expirado');
    return coupon;
  }

  async findOneBy(params: {
    filters: FindOptionsWhere<Coupon> | FindOptionsWhere<Coupon>[];
    relations?: FindOptionsRelations<Coupon>;
  }): Promise<Coupon> {
    const coupon = await this.repo.findOne({
      where: params.filters,
      relations: params.relations ?? SELLER_RELATION,
    });
    if (!coupon) throw new NotFoundException('Coupon not found');
    return coupon;
  }

  async findBy(params: {
    order?: FindOptionsOrder<Coupon>;
    filters: FindOptionsWhere<Coupon> | FindOptionsWhere<Coupon>[];
    relations?: FindOptionsRelations<Coupon>;
    page: number;
    size: number;
    withDeleted?: boolean;
  }): Promise<PaginationParser<Coupon>> {
    const result = await paginate<Coupon>(
      this.repo,
      { page: params.page, limit: params.size },
      {
        where: params.filters,
        relations: params.relations ?? SELLER_RELATION,
        order: params.order,
        withDeleted: params.withDeleted,
      },
    );
    return new PaginationParser(result);
  }

  async count(
    filters?: FindOptionsWhere<Coupon> | FindOptionsWhere<Coupon>[],
  ): Promise<number> {
    return this.repo.count({ where: filters });
  }
}
