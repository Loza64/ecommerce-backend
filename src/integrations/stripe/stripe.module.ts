import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ResilienceModule } from 'src/shared/resilience/resilience.module';
import { StripeService } from './stripe.service';

@Module({
  imports: [ConfigModule, ResilienceModule],
  providers: [StripeService],
  exports: [StripeService],
})
export class StripeModule {}
