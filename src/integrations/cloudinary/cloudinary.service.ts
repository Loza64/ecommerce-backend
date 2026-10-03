import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import CircuitBreaker from 'opossum';
import {
  CloudinaryService as Service,
  CloudinaryUploadOptions,
} from '@scwar/nestjs-cloudinary';
import { CircuitBreakerFactory } from 'src/shared/resilience/circuit-breaker.factory';
import { isCircuitBreakerFailure } from 'src/shared/resilience/circuit-breaker.errors';

const SERVICE_UNAVAILABLE_MESSAGE =
  'El servicio de almacenamiento de archivos no está disponible en este momento. Intenta de nuevo en unos segundos.';

const isClientError = (err: unknown): boolean => {
  const httpCode = (err as { http_code?: number } | undefined)?.http_code;
  return typeof httpCode === 'number' && httpCode < 500;
};

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);

  private readonly uploadBreaker: CircuitBreaker<
    [Buffer, CloudinaryUploadOptions],
    ReturnType<Service['upload']> extends Promise<infer R> ? R : never
  >;
  private readonly destroyBreaker: CircuitBreaker<
    [string],
    ReturnType<Service['delete']> extends Promise<infer R> ? R : never
  >;

  constructor(
    private readonly cloudinary: Service,
    breakerFactory: CircuitBreakerFactory,
  ) {
    this.uploadBreaker = breakerFactory.create(
      (filePath: Buffer, config: CloudinaryUploadOptions) =>
        this.cloudinary.upload(filePath, config),
      { name: 'cloudinary.upload', errorFilter: isClientError },
    );

    this.destroyBreaker = breakerFactory.create(
      (public_id: string) => this.cloudinary.delete(public_id),
      { name: 'cloudinary.destroy', errorFilter: isClientError },
    );
  }

  upload(filePath: Buffer, config: CloudinaryUploadOptions) {
    return this.fire(
      () => this.uploadBreaker.fire(filePath, config),
      this.uploadBreaker.name,
    );
  }

  destroy(public_id: string) {
    return this.fire(
      () => this.destroyBreaker.fire(public_id),
      this.destroyBreaker.name,
    );
  }

  private async fire<TResult>(
    action: () => Promise<TResult>,
    breakerName: string,
  ): Promise<TResult> {
    try {
      return await action();
    } catch (err) {
      if (isCircuitBreakerFailure(err)) {
        this.logger.error(
          `[${breakerName}] short-circuited: ${(err as Error).message}`,
        );
        throw new ServiceUnavailableException(SERVICE_UNAVAILABLE_MESSAGE);
      }
      throw err;
    }
  }
}
