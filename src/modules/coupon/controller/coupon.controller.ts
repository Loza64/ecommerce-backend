import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { FindOptionsWhere, IsNull, Not } from 'typeorm';
import BaseQuerys from 'src/common/dto/base-querys.dto';
import { Profile } from 'src/common/decorators/profile';
import { PreAuthorized } from 'src/common/decorators/pre-authorized';
import { PERMISSIONS } from 'src/common/constants/permissions';
import { parseSearch, parseSort } from 'src/common/helpers/entities.parse';
import { User } from 'src/modules/user/domain/entity/user.entity';
import { CouponService } from '../service/coupon.service';
import { Coupon } from '../domain/entity/coupon.entity';
import { CouponMapper } from '../domain/mappers/coupon.mapper';
import { CouponResponseDto } from '../domain/dto/response.dto';
import { CreateCouponDto, UpdateCouponDto } from '../domain/dto/payload.dto';
import { CouponQuerys } from '../domain/dto/querys';

@Controller('coupons')
export class CouponController {
  constructor(private readonly couponService: CouponService) {}

  private async list(query: BaseQuerys, extra: FindOptionsWhere<Coupon> = {}) {
    const { page, pageSize: size, deleted, search, sort } = query;

    const baseFilter: FindOptionsWhere<Coupon> = {
      ...extra,
      deletedAt: deleted ? Not(IsNull()) : IsNull(),
    };
    const filters = parseSearch<Coupon>(search, ['code'], baseFilter);
    const order = parseSort<Coupon>({ sort, defaultSort: { id: 'DESC' } });

    const result = await this.couponService.findBy({
      withDeleted: deleted,
      filters,
      order,
      page,
      size,
    });
    const uses = await this.couponService.usesByCoupon(
      result.data.map((coupon) => coupon.id),
    );
    return CouponMapper.toPaginatedResponse(result, uses);
  }

  private async respond(coupon: Coupon): Promise<CouponResponseDto> {
    return CouponMapper.toResponse(
      coupon,
      await this.couponService.usesOf(coupon.id),
    );
  }

  /* --------------- cupones del vendedor (declarados antes de :id) --------------- */

  /** Mis cupones: aplican solo a mis productos y el descuento lo asumo yo */
  @Get('mine')
  @HttpCode(HttpStatus.OK)
  findMine(@Query() query: BaseQuerys, @Profile() profile: User) {
    return this.list(query, { sellerId: profile.id });
  }

  @Post('mine')
  async createMine(
    @Body() dto: CreateCouponDto,
    @Profile() profile: User,
  ): Promise<CouponResponseDto> {
    return this.respond(await this.couponService.create(dto, profile.id));
  }

  @Put('mine/:id')
  @HttpCode(HttpStatus.OK)
  async updateMine(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateCouponDto,
    @Profile() profile: User,
  ): Promise<CouponResponseDto> {
    return this.respond(
      await this.couponService.update({ id, data, sellerId: profile.id }),
    );
  }

  @Delete('mine/:id')
  @HttpCode(HttpStatus.OK)
  async softDeleteMine(
    @Param('id', ParseIntPipe) id: number,
    @Profile() profile: User,
  ): Promise<CouponResponseDto> {
    return this.respond(await this.couponService.softDelete(id, profile.id));
  }

  @Patch('mine/:id/restore')
  @HttpCode(HttpStatus.OK)
  async restoreMine(
    @Param('id', ParseIntPipe) id: number,
    @Profile() profile: User,
  ): Promise<CouponResponseDto> {
    return this.respond(await this.couponService.softRestore(id, profile.id));
  }

  /* ----------------- administración (todos los cupones) ----------------- */

  @Get()
  @PreAuthorized(PERMISSIONS.READ_COUPON)
  @HttpCode(HttpStatus.OK)
  findAll(@Query() query: CouponQuerys) {
    const extra: FindOptionsWhere<Coupon> = {};
    if (query.seller) extra.sellerId = query.seller;
    else if (query.scope === 'platform') extra.sellerId = IsNull();
    else if (query.scope === 'sellers') extra.sellerId = Not(IsNull());
    return this.list(query, extra);
  }

  @Get(':id')
  @PreAuthorized(PERMISSIONS.READ_COUPON)
  @HttpCode(HttpStatus.OK)
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<CouponResponseDto> {
    return this.respond(
      await this.couponService.findOneBy({ filters: { id } }),
    );
  }

  /** Crea un cupón de la plataforma (descuenta todo el carrito) */
  @Post()
  @PreAuthorized(PERMISSIONS.CREATE_COUPON)
  async create(@Body() dto: CreateCouponDto): Promise<CouponResponseDto> {
    return this.respond(await this.couponService.create(dto));
  }

  @Put(':id')
  @PreAuthorized(PERMISSIONS.UPDATE_COUPON)
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateCouponDto,
  ): Promise<CouponResponseDto> {
    return this.respond(await this.couponService.update({ id, data }));
  }

  @Delete(':id')
  @PreAuthorized(PERMISSIONS.DELETE_COUPON)
  @HttpCode(HttpStatus.OK)
  async softDelete(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<CouponResponseDto> {
    return this.respond(await this.couponService.softDelete(id));
  }

  @Patch(':id/restore')
  @PreAuthorized(PERMISSIONS.RESTORE_COUPON)
  @HttpCode(HttpStatus.OK)
  async restore(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<CouponResponseDto> {
    return this.respond(await this.couponService.softRestore(id));
  }
}
