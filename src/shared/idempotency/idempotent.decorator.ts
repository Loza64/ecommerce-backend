import { applyDecorators, UseInterceptors } from '@nestjs/common';
import { ApiHeader } from '@nestjs/swagger';
import { IdempotencyInterceptor } from './idempotency.interceptor';

/** Hace idempotente un endpoint mediante el header `Idempotency-Key` */
export const Idempotent = () =>
  applyDecorators(
    UseInterceptors(IdempotencyInterceptor),
    ApiHeader({
      name: 'Idempotency-Key',
      required: true,
      description:
        'Clave única por operación (ej. UUID v4). Reintentar con la misma clave devuelve la respuesta original.',
    }),
  );
