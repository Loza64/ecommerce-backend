import { registerDecorator, ValidationOptions } from 'class-validator';

const MAX_KEYS = 20;
const MAX_KEY_LENGTH = 50;
const MAX_VALUE_LENGTH = 100;

/**
 * Valida un objeto plano `{ clave: string | number | boolean }`.
 * Ej: { "Talla": "M", "Color": "Rojo" }
 */
export function IsFlatAttributes(options?: ValidationOptions) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      name: 'isFlatAttributes',
      target: object.constructor,
      propertyName,
      options: {
        message: `${propertyName} debe ser un objeto plano (máx. ${MAX_KEYS} claves) con valores string, number o boolean`,
        ...options,
      },
      validator: {
        validate(value: unknown): boolean {
          if (typeof value !== 'object' || value === null) return false;
          if (Array.isArray(value)) return false;
          const entries = Object.entries(value);
          if (entries.length > MAX_KEYS) return false;
          return entries.every(([key, val]) => {
            if (!key || key.length > MAX_KEY_LENGTH) return false;
            if (typeof val === 'string') return val.length <= MAX_VALUE_LENGTH;
            return typeof val === 'number' || typeof val === 'boolean';
          });
        },
      },
    });
  };
}
