import * as common from '@nestjs/common';
import { Request } from 'express';
import Stripe from 'stripe';
import { Public } from 'src/common/decorators/public';
import { StripeService } from 'src/integrations/stripe/stripe.service';
import { StripeWebhookService } from '../service/stripe-webhook.service';

@common.Controller('payments/stripe')
export class StripeWebhookController {
  constructor(
    private readonly stripe: StripeService,
    private readonly webhookService: StripeWebhookService,
  ) {}

  /** Endpoint que se registra en el dashboard de Stripe */
  @common.Post('webhook')
  @Public()
  @common.HttpCode(common.HttpStatus.OK)
  async handle(
    @common.Req() req: common.RawBodyRequest<Request>,
    @common.Headers('stripe-signature') signature?: string,
  ): Promise<{ received: true }> {
    if (!signature || !req.rawBody)
      throw new common.BadRequestException(
        'Falta la firma o el body del webhook',
      );

    let event: Stripe.Event;
    try {
      event = this.stripe.constructEvent(req.rawBody, signature);
    } catch {
      throw new common.BadRequestException('Firma del webhook inválida');
    }

    await this.webhookService.process(event);
    return { received: true };
  }
}
