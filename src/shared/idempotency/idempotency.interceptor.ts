import {
  BadRequestException,
  CallHandler,
  ConflictException,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  UnprocessableEntityException,
} from '@nestjs/common';
import { createHash } from 'crypto';
import { Response } from 'express';
import {
  catchError,
  from,
  map,
  mergeMap,
  Observable,
  of,
  switchMap,
  throwError,
} from 'rxjs';
import { RequestWithUser } from 'src/common/models/request-with-user';
import { IdempotencyService } from './idempotency.service';

export const IDEMPOTENCY_HEADER = 'idempotency-key';
const KEY_PATTERN = /^[A-Za-z0-9_.:-]{8,128}$/;

/**
 * Exige el header `Idempotency-Key`. Si la misma clave (del mismo usuario)
 * se repite con la misma petición, devuelve la respuesta guardada sin volver
 * a ejecutar el handler. Si se repite con otra petición => 422.
 */
@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  constructor(private readonly idempotency: IdempotencyService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const req = http.getRequest<RequestWithUser>();
    const res = http.getResponse<Response>();

    const headerKey = req.header(IDEMPOTENCY_HEADER);
    if (!headerKey)
      throw new BadRequestException('El header Idempotency-Key es obligatorio');
    if (!KEY_PATTERN.test(headerKey))
      throw new BadRequestException(
        'Idempotency-Key inválido (8-128 caracteres: letras, números, _ . : -)',
      );

    const scope = req.user ? String(req.user.id) : 'anon';
    const redisKey = `idem:${scope}:${headerKey}`;
    const path = req.originalUrl.split('?')[0];
    const fingerprint = createHash('sha256')
      .update(`${req.method}:${path}:${JSON.stringify(req.body ?? {})}`)
      .digest('hex');

    return from(this.idempotency.begin(redisKey, fingerprint)).pipe(
      switchMap((result): Observable<unknown> => {
        switch (result.state) {
          case 'mismatch':
            return throwError(
              () =>
                new UnprocessableEntityException(
                  'Esta Idempotency-Key ya se usó con una petición distinta',
                ),
            );
          case 'in_progress':
            return throwError(
              () =>
                new ConflictException(
                  'Ya hay una petición en curso con esta Idempotency-Key',
                ),
            );
          case 'replay':
            res.setHeader('Idempotent-Replayed', 'true');
            return of(result.response.body);
          case 'acquired':
            return next.handle().pipe(
              // si el handler falla se libera la clave para permitir reintentos
              catchError((err: unknown) =>
                from(this.idempotency.release(redisKey, result.owner)).pipe(
                  mergeMap(() => throwError(() => err)),
                ),
              ),
              mergeMap((body: unknown) =>
                from(
                  this.idempotency.complete(
                    redisKey,
                    result.owner,
                    fingerprint,
                    body,
                  ),
                ).pipe(map(() => body)),
              ),
            );
        }
      }),
    );
  }
}
