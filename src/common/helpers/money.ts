/**
 * Toda la aritmética de dinero se hace en centavos (enteros) para evitar
 * errores de punto flotante. Los valores `decimal` de la BD se convierten
 * solo en los bordes (entrada/salida).
 */
export const toCents = (amount: number): number => Math.round(amount * 100);

export const fromCents = (cents: number): number => Math.round(cents) / 100;
