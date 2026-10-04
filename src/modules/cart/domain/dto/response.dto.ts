import { BaseResponse } from 'src/common/dto/base-response.dto';
import { UploadResponseDto } from 'src/modules/upload/domain/dto/response.dto';
import { DiscountType } from 'src/modules/coupon/domain/entity/coupon.entity';
import { VariantAttributes } from 'src/modules/product/domain/entity/product-variant.entity';
import { CartStatus } from '../entity/cart.entity';

export class CartItemResponseDto extends BaseResponse {
  quantity!: number;
  priceAtAddition!: number;
  /** Precio actual de la variante */
  currentPrice!: number;
  /** true si el vendedor cambió el precio después de agregarlo */
  priceChanged!: boolean;
  stockQuantity!: number;
  lineTotal!: number;
  productVariant!: { id: number; sku: string; attributes: VariantAttributes };
  product!: { id: number; name: string; image: UploadResponseDto | null };
}

export class CartResponseDto extends BaseResponse {
  status!: CartStatus;
  items!: CartItemResponseDto[];
  coupon!: {
    id: number;
    code: string;
    discountType: DiscountType;
    discountValue: number;
    expirationDate: Date;
    /** Vendedor dueño del cupón; null = cupón de la plataforma */
    seller: { id: number; username: string; name: string } | null;
    /** false si el carrito ya no tiene productos a los que aplique (descuento 0) */
    applicable: boolean;
  } | null;
  subtotal!: number;
  discount!: number;
  total!: number;
}
