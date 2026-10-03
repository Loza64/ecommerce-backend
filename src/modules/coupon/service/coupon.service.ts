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

@Injectable()
export class CouponService implements ICrudService<
  Coupon,
  CreateCouponDto,
  UpdateCouponDto
> {
  constructor(
    @InjectRepository(Coupon) private readonly repo: Repository<Coupon>,
  ) {}

  private assertValid(
    type: DiscountType,
    value: number,
    expirationDate: Date,
    checkFuture: boolean,
  ): void {
    if (type === DiscountType.PERCENTAGE && value > 100)
      throw new BadRequestException(
        'El descuento porcentual no puede superar 100',
      );
    if (checkFuture && expirationDate.getTime() <= Date.now())
      throw new BadRequestException('La fecha de expiración debe ser futura');
  }

  private async assertCodeAvailable(
    code: string,
    selfId?: number,
  ): Promise<void> {
    const existing = await this.repo.findOne({ where: { code } });
    if (existing && existing.id !== selfId)
      throw new ConflictException(`El cupón "${code}" ya existe`);
  }

  async create(data: CreateCouponDto): Promise<Coupon> {
    this.assertValid(
      data.discountType,
      data.discountValue,
      data.expirationDate,
      true,
    );
    await this.assertCodeAvailable(data.code);
    return this.repo.save(this.repo.create(data));
  }

  async update({
    id,
    data,
  }: {
    id: number;
    data: UpdateCouponDto;
  }): Promise<Coupon> {
    const coupon = await this.findOneBy({ filters: { id } });
    Object.assign(coupon, data);
    this.assertValid(
      coupon.discountType,
      coupon.discountValue,
      coupon.expirationDate,
      data.expirationDate !== undefined,
    );
    if (data.code) await this.assertCodeAvailable(coupon.code, id);
    return this.repo.save(coupon);
  }

  async delete(id: number): Promise<Coupon> {
    const coupon = await this.findOneBy({ filters: { id } });
    await this.repo.remove(coupon);
    return coupon;
  }

  async softDelete(id: number): Promise<Coupon> {
    await this.findOneBy({ filters: { id } });
    await this.repo.softDelete(id);
    return this.repo.findOneOrFail({ where: { id }, withDeleted: true });
  }

  async softRestore(id: number): Promise<Coupon> {
    const coupon = await this.repo.findOne({
      where: { id },
      withDeleted: true,
    });
    if (!coupon) throw new NotFoundException(`Cupón ${id} no existe`);
    await this.assertCodeAvailable(coupon.code, id);
    await this.repo.restore(id);
    return this.repo.findOneByOrFail({ id });
  }

  /** Cupón vigente (no eliminado y no expirado) por código */
  async findValidByCode(code: string): Promise<Coupon> {
    const coupon = await this.repo.findOne({ where: { code } });
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
      relations: params.relations,
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
        relations: params.relations,
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
