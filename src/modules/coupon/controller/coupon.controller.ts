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
import { PreAuthorized } from 'src/common/decorators/pre-authorized';
import { PERMISSIONS } from 'src/common/constants/permissions';
import { parseSearch, parseSort } from 'src/common/helpers/entities.parse';
import { CouponService } from '../service/coupon.service';
import { Coupon } from '../domain/entity/coupon.entity';
import { CouponMapper } from '../domain/mappers/coupon.mapper';
import { CouponResponseDto } from '../domain/dto/response.dto';
import { CreateCouponDto, UpdateCouponDto } from '../domain/dto/payload.dto';

@Controller('coupons')
export class CouponController {
  constructor(private readonly couponService: CouponService) {}

  @Get()
  @PreAuthorized(PERMISSIONS.READ_COUPON)
  @HttpCode(HttpStatus.OK)
  async findAll(@Query() query: BaseQuerys) {
    const { page, pageSize: size, deleted, search, sort } = query;

    const baseFilter: FindOptionsWhere<Coupon> = {
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
    return CouponMapper.toPaginatedResponse(result);
  }

  @Get(':id')
  @PreAuthorized(PERMISSIONS.READ_COUPON)
  @HttpCode(HttpStatus.OK)
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<CouponResponseDto> {
    const coupon = await this.couponService.findOneBy({ filters: { id } });
    return CouponMapper.toResponse(coupon);
  }

  @Post()
  @PreAuthorized(PERMISSIONS.CREATE_COUPON)
  async create(@Body() dto: CreateCouponDto): Promise<CouponResponseDto> {
    const coupon = await this.couponService.create(dto);
    return CouponMapper.toResponse(coupon);
  }

  @Put(':id')
  @PreAuthorized(PERMISSIONS.UPDATE_COUPON)
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateCouponDto,
  ): Promise<CouponResponseDto> {
    const coupon = await this.couponService.update({ id, data });
    return CouponMapper.toResponse(coupon);
  }

  @Delete(':id')
  @PreAuthorized(PERMISSIONS.DELETE_COUPON)
  @HttpCode(HttpStatus.OK)
  async softDelete(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<CouponResponseDto> {
    const coupon = await this.couponService.softDelete(id);
    return CouponMapper.toResponse(coupon);
  }

  @Patch(':id/restore')
  @PreAuthorized(PERMISSIONS.RESTORE_COUPON)
  @HttpCode(HttpStatus.OK)
  async restore(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<CouponResponseDto> {
    const coupon = await this.couponService.softRestore(id);
    return CouponMapper.toResponse(coupon);
  }
}
