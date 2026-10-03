import { UploadMapper } from 'src/modules/upload/domain/mappers/upload.mapper';
import { fromCents, toCents } from 'src/common/helpers/money';
import { Cart } from '../entity/cart.entity';
import { CartItem } from '../entity/cart-item.entity';
import { CartItemResponseDto, CartResponseDto } from '../dto/response.dto';
import { computeTotals, totalsToAmounts } from '../../cart-pricing';

export class CartMapper {
  static itemToResponse(item: CartItem): CartItemResponseDto {
    const variant = item.productVariant;
    const product = variant.product;
    const cover = [...(product?.images ?? [])]
      .filter((image) => image.upload)
      .sort((a, b) => a.position - b.position)[0];

    return {
      id: item.id,
      quantity: item.quantity,
      priceAtAddition: item.priceAtAddition,
      currentPrice: variant.price,
      priceChanged: toCents(variant.price) !== toCents(item.priceAtAddition),
      stockQuantity: variant.stockQuantity,
      lineTotal: fromCents(toCents(item.priceAtAddition) * item.quantity),
      productVariant: {
        id: variant.id,
        sku: variant.sku,
        attributes: variant.attributes,
      },
      product: {
        id: product?.id,
        name: product?.name,
        image: cover ? UploadMapper.toResponse(cover.upload) : null,
      },
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      deletedAt: item.deletedAt,
    };
  }

  static toResponse(cart: Cart): CartResponseDto {
    const items = (cart.items ?? []).filter((i) => i.productVariant);
    const coupon = cart.coupons?.[0]?.coupon ?? null;

    const totals = computeTotals(
      items.map((i) => ({
        unitPrice: i.priceAtAddition,
        quantity: i.quantity,
      })),
      coupon,
    );

    return {
      id: cart.id,
      status: cart.status,
      items: items
        .sort((a, b) => a.id - b.id)
        .map((i) => this.itemToResponse(i)),
      coupon: coupon
        ? {
            id: coupon.id,
            code: coupon.code,
            discountType: coupon.discountType,
            discountValue: coupon.discountValue,
            expirationDate: coupon.expirationDate,
          }
        : null,
      ...totalsToAmounts(totals),
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt,
      deletedAt: cart.deletedAt,
    };
  }
}
