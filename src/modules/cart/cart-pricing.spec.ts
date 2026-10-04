import { describe, expect, it } from '@jest/globals';
import { DiscountType } from 'src/modules/coupon/domain/entity/coupon.entity';
import {
  allocateCents,
  computeTotals,
  eligibleSubtotalCents,
} from './cart-pricing';

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

describe('cupones de vendedor', () => {
  const lines = [
    { unitPrice: 10, quantity: 2, sellerId: 1 }, // 20.00 del vendedor 1
    { unitPrice: 30, quantity: 1, sellerId: 2 }, // 30.00 del vendedor 2
  ];

  it('un cupón de la plataforma descuenta todo el carrito', () => {
    const totals = computeTotals(lines, {
      discountType: DiscountType.PERCENTAGE,
      discountValue: 10,
    });
    expect(totals.discountCents).toBe(500);
  });

  it('un cupón de vendedor solo descuenta sus productos', () => {
    const totals = computeTotals(lines, {
      discountType: DiscountType.PERCENTAGE,
      discountValue: 50,
      sellerId: 1,
    });
    expect(totals.subtotalCents).toBe(5000);
    expect(totals.discountCents).toBe(1000);
    expect(totals.totalCents).toBe(4000);
  });

  it('el descuento fijo de vendedor no supera sus productos', () => {
    const totals = computeTotals(lines, {
      discountType: DiscountType.FIXED,
      discountValue: 100,
      sellerId: 1,
    });
    expect(totals.discountCents).toBe(2000);
    expect(totals.totalCents).toBe(3000);
  });

  it('sin productos del vendedor no hay descuento ni subtotal elegible', () => {
    const rule = {
      discountType: DiscountType.PERCENTAGE,
      discountValue: 20,
      sellerId: 99,
    };
    expect(eligibleSubtotalCents(lines, rule)).toBe(0);
    expect(computeTotals(lines, rule).discountCents).toBe(0);
  });
});

describe('allocateCents', () => {
  it('reparte en proporción sin perder centavos', () => {
    const shares = allocateCents([1000, 1000, 1000], 100);
    expect(shares.reduce((a, b) => a + b, 0)).toBe(100);
    expect([...shares].sort()).toEqual([33, 33, 34]);
  });

  it('respeta los pesos distintos', () => {
    expect(allocateCents([3000, 1000], 400)).toEqual([300, 100]);
  });

  it('el resto va a las líneas con mayor fracción', () => {
    // 1/3 y 2/3 de 1 centavo => el centavo es para la línea mayor
    expect(allocateCents([100, 200], 1)).toEqual([0, 1]);
  });

  it('sin peso o sin descuento devuelve ceros', () => {
    expect(allocateCents([0, 0], 50)).toEqual([0, 0]);
    expect(allocateCents([500, 500], 0)).toEqual([0, 0]);
  });

  it('soporta importes grandes sin desbordar', () => {
    const big = 9_999_999_999; // ~100 millones en centavos
    const shares = allocateCents([big, big], big);
    expect(shares[0] + shares[1]).toBe(big);
  });
});
