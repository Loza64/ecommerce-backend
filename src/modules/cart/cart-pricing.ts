import { fromCents, toCents } from 'src/common/helpers/money';
import { DiscountType } from 'src/modules/coupon/domain/entity/coupon.entity';

export interface PricedLine {
  unitPrice: number;
  quantity: number;
}

export interface DiscountRule {
  discountType: DiscountType;
  discountValue: number;
}

export interface CartTotals {
  subtotalCents: number;
  discountCents: number;
  totalCents: number;
}

/** Calcula totales en centavos. El descuento nunca supera el subtotal. */
export function computeTotals(
  lines: PricedLine[],
  coupon?: DiscountRule | null,
): CartTotals {
  const subtotalCents = lines.reduce(
    (sum, line) => sum + toCents(line.unitPrice) * line.quantity,
    0,
  );

  let discountCents = 0;
  if (coupon) {
    discountCents =
      coupon.discountType === DiscountType.PERCENTAGE
        ? Math.round((subtotalCents * coupon.discountValue) / 100)
        : toCents(coupon.discountValue);
    discountCents = Math.min(Math.max(discountCents, 0), subtotalCents);
  }

  return {
    subtotalCents,
    discountCents,
    totalCents: subtotalCents - discountCents,
  };
}

export const totalsToAmounts = (totals: CartTotals) => ({
  subtotal: fromCents(totals.subtotalCents),
  discount: fromCents(totals.discountCents),
  total: fromCents(totals.totalCents),
});
