import { fromCents, toCents } from 'src/common/helpers/money';
import { DiscountType } from 'src/modules/coupon/domain/entity/coupon.entity';

export interface PricedLine {
  unitPrice: number;
  quantity: number;
  /** Vendedor del producto; necesario para cupones de vendedor */
  sellerId?: number | null;
}

export interface DiscountRule {
  discountType: DiscountType;
  discountValue: number;
  /**
   * Cupón de vendedor: solo descuenta las líneas de ese vendedor.
   * Sin valor (cupón de la plataforma) descuenta todo el carrito.
   */
  sellerId?: number | null;
}

export interface CartTotals {
  subtotalCents: number;
  discountCents: number;
  totalCents: number;
}

const lineCents = (line: PricedLine): number =>
  toCents(line.unitPrice) * line.quantity;

/** ¿El cupón aplica a esta línea? */
export const isLineEligible = (
  line: PricedLine,
  coupon: DiscountRule,
): boolean => !coupon.sellerId || line.sellerId === coupon.sellerId;

/** Subtotal (en centavos) sobre el que actúa el cupón */
export function eligibleSubtotalCents(
  lines: PricedLine[],
  coupon: DiscountRule,
): number {
  return lines
    .filter((line) => isLineEligible(line, coupon))
    .reduce((sum, line) => sum + lineCents(line), 0);
}

/**
 * Calcula totales en centavos. El descuento se calcula solo sobre las líneas
 * elegibles del cupón y nunca supera ese subtotal.
 */
export function computeTotals(
  lines: PricedLine[],
  coupon?: DiscountRule | null,
): CartTotals {
  const subtotalCents = lines.reduce((sum, line) => sum + lineCents(line), 0);

  let discountCents = 0;
  if (coupon) {
    const eligibleCents = eligibleSubtotalCents(lines, coupon);
    discountCents =
      coupon.discountType === DiscountType.PERCENTAGE
        ? Math.round((eligibleCents * coupon.discountValue) / 100)
        : toCents(coupon.discountValue);
    discountCents = Math.min(Math.max(discountCents, 0), eligibleCents);
  }

  return {
    subtotalCents,
    discountCents,
    totalCents: subtotalCents - discountCents,
  };
}

/**
 * Reparte `totalCents` entre las líneas en proporción a su peso (centavos)
 * sin perder ni sobrar ningún centavo (método del mayor resto).
 */
export function allocateCents(
  weightsCents: number[],
  totalCents: number,
): number[] {
  const sum = weightsCents.reduce((acc, w) => acc + w, 0);
  if (sum <= 0 || totalCents <= 0) return weightsCents.map(() => 0);

  const sumBig = BigInt(sum);
  const totalBig = BigInt(totalCents);
  const shares = weightsCents.map((w, index) => {
    const product = BigInt(w) * totalBig;
    return {
      index,
      floor: Number(product / sumBig),
      remainder: product % sumBig,
    };
  });

  let left = totalCents - shares.reduce((acc, s) => acc + s.floor, 0);
  const byRemainder = [...shares].sort((a, b) =>
    a.remainder === b.remainder
      ? a.index - b.index
      : a.remainder > b.remainder
        ? -1
        : 1,
  );

  const result = shares.map((s) => s.floor);
  for (const share of byRemainder) {
    if (left <= 0) break;
    result[share.index] += 1;
    left -= 1;
  }
  return result;
}

export const totalsToAmounts = (totals: CartTotals) => ({
  subtotal: fromCents(totals.subtotalCents),
  discount: fromCents(totals.discountCents),
  total: fromCents(totals.totalCents),
});
