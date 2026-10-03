import { BaseResponse } from 'src/common/dto/base-response.dto';
import { DiscountType } from '../entity/coupon.entity';

export class CouponResponseDto extends BaseResponse {
  code!: string;
  discountType!: DiscountType;
  discountValue!: number;
  expirationDate!: Date;
}
