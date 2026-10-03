import { Module } from '@nestjs/common';
import { StripeModule } from 'src/integrations/stripe/stripe.module';
import { OrderModule } from '../order/order.module';
import { StripeWebhookController } from './controller/stripe-webhook.controller';
import { StripeWebhookService } from './service/stripe-webhook.service';

@Module({
  imports: [StripeModule, OrderModule],
  providers: [StripeWebhookService],
  controllers: [StripeWebhookController],
})
export class PaymentModule {}
