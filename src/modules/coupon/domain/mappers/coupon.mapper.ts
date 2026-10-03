import { PaginationParser } from 'src/common/parser/pagination.parser';
import { PaginatedResponseDto } from 'src/common/dto/paginated-response.dto';
import { Coupon } from '../entity/coupon.entity';
import { CouponResponseDto } from '../dto/response.dto';

export class CouponMapper {
  static toResponse(entity: Coupon): CouponResponseDto {
    return {
      id: entity.id,
      code: entity.code,
      discountType: entity.discountType,
      discountValue: entity.discountValue,
      expirationDate: entity.expirationDate,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt,
    };
  }

  static toResponseList(entities: Coupon[]): CouponResponseDto[] {
    return entities.map((e) => this.toResponse(e));
  }

  static toPaginatedResponse(
    pagination: PaginationParser<Coupon>,
  ): PaginatedResponseDto<CouponResponseDto> {
    return new PaginatedResponseDto(
      this.toResponseList(pagination.data),
      pagination.pagination,
    );
  }
}
