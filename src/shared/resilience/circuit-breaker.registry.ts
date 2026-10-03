import { Injectable, Logger } from '@nestjs/common';
import CircuitBreaker from 'opossum';

export type CircuitState = 'closed' | 'open' | 'halfOpen';

export interface CircuitBreakerSnapshot {
  name: string;
  state: CircuitState;
  enabled: boolean;
  stats: {
    fires: number;
    successes: number;
    failures: number;
    rejects: number;
    timeouts: number;
    latencyMeanMs: number;
  };
}

@Injectable()
export class CircuitBreakerRegistry {
  private readonly logger = new Logger(CircuitBreakerRegistry.name);
  private readonly breakers = new Map<
    string,
    CircuitBreaker<unknown[], unknown>
  >();

  register(name: string, breaker: CircuitBreaker<unknown[], unknown>): void {
    if (this.breakers.has(name)) {
      this.logger.warn(
        `[${name}] re-registrando circuit breaker (se reemplaza la instancia anterior)`,
      );
    }
    this.breakers.set(name, breaker);
  }

  private resolveState(
    breaker: CircuitBreaker<unknown[], unknown>,
  ): CircuitState {
    if (breaker.opened) return 'open';
    if (breaker.halfOpen) return 'halfOpen';
    return 'closed';
  }

  getStatus(): CircuitBreakerSnapshot[] {
    return Array.from(this.breakers.values()).map((breaker) => ({
      name: breaker.name,
      state: this.resolveState(breaker),
      enabled: breaker.enabled,
      stats: {
        fires: breaker.stats.fires,
        successes: breaker.stats.successes,
        failures: breaker.stats.failures,
        rejects: breaker.stats.rejects,
        timeouts: breaker.stats.timeouts,
        latencyMeanMs: breaker.stats.latencyMean,
      },
    }));
  }
}
