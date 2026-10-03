import { Module } from '@nestjs/common';
import { ResilienceModule } from 'src/shared/resilience/resilience.module';
import { HealthController } from './health.controller';

@Module({
  imports: [ResilienceModule],
  controllers: [HealthController],
})
export class HealthModule {}
