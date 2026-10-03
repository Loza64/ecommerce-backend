import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CircuitBreakerRegistry } from './circuit-breaker.registry';
import { CircuitBreakerFactory } from './circuit-breaker.factory';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [CircuitBreakerRegistry, CircuitBreakerFactory],
  exports: [CircuitBreakerRegistry, CircuitBreakerFactory],
})
export class ResilienceModule {}
