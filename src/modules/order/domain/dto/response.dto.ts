import { BaseResponse } from 'src/common/dto/base-response.dto';
import { VariantAttributes } from 'src/modules/product/domain/entity/product-variant.entity';
import { OrderStatus } from '../entity/order.entity';

export class OrderItemResponseDto extends BaseResponse {
  productVariantId!: number | null;
  productName!: string;
  sku!: string;
  attributes!: VariantAttributes;
  quantity!: number;
  unitPrice!: number;
  lineTotal!: number;
}

export class OrderResponseDto extends BaseResponse {
  status!: OrderStatus;
  subtotal!: number;
  discountTotal!: number;
  total!: number;
  currency!: string;
  couponCode!: string | null;
  paidAt!: Date | null;
  items!: OrderItemResponseDto[];
}

export class CheckoutResponseDto {
  order!: OrderResponseDto;
  /** Se usa en el front con Stripe.js (confirmPayment). null si el total es 0 */
  clientSecret!: string | null;
}

/** Vista del vendedor: sus items vendidos en pedidos pagados */
export class SaleResponseDto extends OrderItemResponseDto {
  order!: {
    id: number;
    status: OrderStatus;
    paidAt: Date | null;
    buyer: { id: number; username: string; name: string } | null;
  };
}
