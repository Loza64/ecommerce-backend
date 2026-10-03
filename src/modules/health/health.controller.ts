import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { Public } from 'src/common/decorators/public';
import {
  CircuitBreakerRegistry,
  CircuitBreakerSnapshot,
} from 'src/shared/resilience/circuit-breaker.registry';

@Controller('health')
export class HealthController {
  constructor(private readonly registry: CircuitBreakerRegistry) {}

  @Public()
  @Get('circuit-breakers')
  @HttpCode(HttpStatus.OK)
  getCircuitBreakers(): { data: CircuitBreakerSnapshot[] } {
    return { data: this.registry.getStatus() };
  }
}
