import { describe, expect, it } from '@jest/globals';
import { DiscountType } from 'src/modules/coupon/domain/entity/coupon.entity';
import { computeTotals } from './cart-pricing';

describe('computeTotals', () => {
  const lines = [
    { unitPrice: 19.99, quantity: 2 },
    { unitPrice: 5.5, quantity: 1 },
  ];

  it('suma el subtotal sin errores de flotante', () => {
    expect(computeTotals(lines)).toEqual({
      subtotalCents: 4548,
      discountCents: 0,
      totalCents: 4548,
    });
  });

  it('aplica cupón porcentual', () => {
    const totals = computeTotals(lines, {
      discountType: DiscountType.PERCENTAGE,
      discountValue: 10,
    });
    expect(totals.discountCents).toBe(455);
    expect(totals.totalCents).toBe(4093);
  });

  it('aplica cupón fijo', () => {
    const totals = computeTotals(lines, {
      discountType: DiscountType.FIXED,
      discountValue: 5,
    });
    expect(totals.discountCents).toBe(500);
    expect(totals.totalCents).toBe(4048);
  });

  it('el descuento fijo nunca supera el subtotal', () => {
    const totals = computeTotals([{ unitPrice: 3, quantity: 1 }], {
      discountType: DiscountType.FIXED,
      discountValue: 50,
    });
    expect(totals.discountCents).toBe(300);
    expect(totals.totalCents).toBe(0);
  });

  it('carrito vacío => 0', () => {
    expect(computeTotals([]).totalCents).toBe(0);
  });
});
