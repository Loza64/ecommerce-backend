import { BaseResponse } from 'src/common/dto/base-response.dto';
import { DiscountType } from '../entity/coupon.entity';

export class CouponResponseDto extends BaseResponse {
  code!: string;
  discountType!: DiscountType;
  discountValue!: number;
  expirationDate!: Date;
  /** null = cupón de la plataforma */
  seller!: { id: number; username: string; name: string } | null;
  maxUses!: number | null;
  maxUsesPerUser!: number | null;
  /** Pedidos pendientes de pago o pagados que usaron el cupón */
  usesCount!: number;
}
