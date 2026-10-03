import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import CircuitBreaker from 'opossum';
import { CircuitBreakerRegistry } from './circuit-breaker.registry';

export interface CreateCircuitBreakerOptions<
  TArgs extends unknown[],
> extends Partial<Omit<CircuitBreaker.Options<TArgs>, 'name'>> {
  name: string;
}

@Injectable()
export class CircuitBreakerFactory {
  private readonly logger = new Logger(CircuitBreakerFactory.name);

  constructor(
    private readonly config: ConfigService,
    private readonly registry: CircuitBreakerRegistry,
  ) {}

  private defaultOptions(): Partial<CircuitBreaker.Options<unknown[]>> {
    return {
      timeout: Number(this.config.get('CB_TIMEOUT_MS')) || 8000,
      errorThresholdPercentage:
        Number(this.config.get('CB_ERROR_THRESHOLD_PERCENTAGE')) || 50,
      resetTimeout: Number(this.config.get('CB_RESET_TIMEOUT_MS')) || 15000,
      volumeThreshold: Number(this.config.get('CB_VOLUME_THRESHOLD')) || 5,
      rollingCountTimeout: 10_000,
      rollingCountBuckets: 10,
    };
  }

  create<TArgs extends unknown[], TResult>(
    action: (...args: TArgs) => Promise<TResult>,
    options: CreateCircuitBreakerOptions<TArgs>,
  ): CircuitBreaker<TArgs, TResult> {
    const breaker = new CircuitBreaker<TArgs, TResult>(action, {
      ...this.defaultOptions(),
      ...options,
    });

    breaker.on('open', () =>
      this.logger.warn(`[${breaker.name}] OPEN — cortando llamadas`),
    );
    breaker.on('halfOpen', () =>
      this.logger.log(
        `[${breaker.name}] HALF-OPEN — probando con la siguiente llamada`,
      ),
    );
    breaker.on('close', () =>
      this.logger.log(`[${breaker.name}] CLOSED — llamadas normales de nuevo`),
    );
    breaker.on('timeout', () =>
      this.logger.warn(
        `[${breaker.name}] la llamada superó el timeout (${
          options.timeout ?? this.defaultOptions().timeout
        }ms)`,
      ),
    );
    breaker.on('reject', () =>
      this.logger.warn(`[${breaker.name}] llamada rechazada, circuito abierto`),
    );
    breaker.on('failure', (err) =>
      this.logger.error(`[${breaker.name}] llamada fallida: ${err}`),
    );

    this.registry.register(breaker.name, breaker);

    return breaker;
  }
}
