import {
  BadRequestException,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  type RawBodyRequest,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import Stripe from 'stripe';
import { Public } from 'src/common/decorators/public';
import { StripeService } from 'src/integrations/stripe/stripe.service';
import { StripeWebhookService } from '../service/stripe-webhook.service';

@Controller('payments/stripe')
export class StripeWebhookController {
  constructor(
    private readonly stripe: StripeService,
    private readonly webhookService: StripeWebhookService,
  ) {}

  /** Endpoint que se registra en el dashboard de Stripe */
  @Post('webhook')
  @Public()
  @HttpCode(HttpStatus.OK)
  async handle(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature?: string,
  ): Promise<{ received: true }> {
    if (!signature || !req.rawBody)
      throw new BadRequestException('Falta la firma o el body del webhook');

    let event: Stripe.Event;
    try {
      event = this.stripe.constructEvent(req.rawBody, signature);
    } catch {
      throw new BadRequestException('Firma del webhook inválida');
    }

    await this.webhookService.process(event);
    return { received: true };
  }
}
