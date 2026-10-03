import { describe, expect, it } from '@jest/globals';
import { fromCents, toCents } from './money';

describe('money', () => {
  it('convierte a centavos sin errores de flotante', () => {
    expect(toCents(0.1 + 0.2)).toBe(30);
    expect(toCents(19.99)).toBe(1999);
    expect(toCents(1.005 * 100)).toBe(10050);
  });

  it('convierte de centavos a decimal', () => {
    expect(fromCents(1999)).toBe(19.99);
    expect(fromCents(0)).toBe(0);
  });
});
