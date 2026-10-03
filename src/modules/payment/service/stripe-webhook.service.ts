import { Injectable, Logger } from '@nestjs/common';
import Stripe from 'stripe';
import { IdempotencyService } from 'src/shared/idempotency/idempotency.service';
import { OrderService } from 'src/modules/order/service/order.service';

@Injectable()
export class StripeWebhookService {
  private readonly logger = new Logger(StripeWebhookService.name);

  constructor(
    private readonly orders: OrderService,
    private readonly idempotency: IdempotencyService,
  ) {}

  /**
   * Stripe puede entregar el mismo evento varias veces. Se deduplica por
   * event.id en Redis y, además, las transiciones de estado son idempotentes.
   * Si el procesamiento falla se libera el id y se responde 5xx para que
   * Stripe reintente.
   */
  async process(event: Stripe.Event): Promise<void> {
    const firstTime = await this.idempotency.claimEvent(event.id);
    if (!firstTime) {
      this.logger.log(`Evento duplicado ignorado: ${event.id} (${event.type})`);
      return;
    }

    try {
      await this.dispatch(event);
    } catch (err) {
      await this.idempotency.releaseEvent(event.id);
      throw err;
    }
  }

  private async dispatch(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const intent = event.data.object;
        const orderId = this.orderIdOf(intent);
        if (!orderId) return;
        await this.orders.markPaid({
          orderId,
          paymentIntentId: intent.id,
          amountCents: intent.amount_received,
          currency: intent.currency,
        });
        return;
      }
      case 'payment_intent.canceled': {
        const orderId = this.orderIdOf(event.data.object);
        if (!orderId) return;
        await this.orders.cancelLocally(orderId);
        return;
      }
      case 'payment_intent.payment_failed': {
        // no es terminal: el cliente puede reintentar con otra tarjeta
        this.logger.warn(
          `Pago fallido para el pedido ${this.orderIdOf(event.data.object) ?? '?'}`,
        );
        return;
      }
      default:
        return;
    }
  }

  private orderIdOf(intent: Stripe.PaymentIntent): number | null {
    const orderId = Number(intent.metadata?.orderId);
    return Number.isInteger(orderId) && orderId > 0 ? orderId : null;
  }
}
