import { PaginationParser } from 'src/common/parser/pagination.parser';
import { PaginatedResponseDto } from 'src/common/dto/paginated-response.dto';
import { Coupon } from '../entity/coupon.entity';
import { CouponResponseDto } from '../dto/response.dto';

export class CouponMapper {
  static toResponse(entity: Coupon, usesCount = 0): CouponResponseDto {
    return {
      id: entity.id,
      code: entity.code,
      discountType: entity.discountType,
      discountValue: entity.discountValue,
      expirationDate: entity.expirationDate,
      seller: entity.seller
        ? {
            id: entity.seller.id,
            username: entity.seller.username,
            name: entity.seller.name,
          }
        : null,
      maxUses: entity.maxUses,
      maxUsesPerUser: entity.maxUsesPerUser,
      usesCount,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt,
    };
  }

  static toResponseList(
    entities: Coupon[],
    uses: Map<number, number>,
  ): CouponResponseDto[] {
    return entities.map((e) => this.toResponse(e, uses.get(e.id) ?? 0));
  }

  static toPaginatedResponse(
    pagination: PaginationParser<Coupon>,
    uses: Map<number, number>,
  ): PaginatedResponseDto<CouponResponseDto> {
    return new PaginatedResponseDto(
      this.toResponseList(pagination.data, uses),
      pagination.pagination,
    );
  }
}
