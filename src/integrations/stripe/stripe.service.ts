import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import CircuitBreaker from 'opossum';
import Stripe from 'stripe';
import { CircuitBreakerFactory } from 'src/shared/resilience/circuit-breaker.factory';
import { isCircuitBreakerFailure } from 'src/shared/resilience/circuit-breaker.errors';

const SERVICE_UNAVAILABLE_MESSAGE =
  'El proveedor de pagos no está disponible en este momento. Intenta de nuevo en unos segundos.';

/** Errores 4xx (tarjeta, parámetros, estado inválido) no abren el circuito */
const isClientError = (err: unknown): boolean => {
  const status = (err as { statusCode?: number } | undefined)?.statusCode;
  return typeof status === 'number' && status < 500;
};

export interface CreatePaymentIntentParams {
  amountCents: number;
  currency: string;
  orderId: number;
  userId: number;
  /** Stripe devuelve el mismo PaymentIntent si se repite esta clave */
  idempotencyKey: string;
}

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  private readonly client: Stripe | null;
  private readonly webhookSecret: string | undefined;
  private readonly breaker: CircuitBreaker<[() => Promise<unknown>], unknown>;

  constructor(config: ConfigService, breakerFactory: CircuitBreakerFactory) {
    const secretKey = config.get<string>('STRIPE_SECRET_KEY');
    this.webhookSecret = config.get<string>('STRIPE_WEBHOOK_SECRET');

    if (!secretKey) {
      this.logger.warn(
        'STRIPE_SECRET_KEY no está configurada: los pagos no estarán disponibles',
      );
      this.client = null;
    } else {
      this.client = new Stripe(secretKey, {
        maxNetworkRetries: 1,
        timeout: 6000,
      });
    }

    this.breaker = breakerFactory.create(
      (operation: () => Promise<unknown>) => operation(),
      { name: 'stripe.api', timeout: 15000, errorFilter: isClientError },
    );
  }

  private get stripe(): Stripe {
    if (!this.client)
      throw new ServiceUnavailableException('Los pagos no están configurados');
    return this.client;
  }

  private async call<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return (await this.breaker.fire(operation)) as T;
    } catch (err) {
      if (isCircuitBreakerFailure(err)) {
        this.logger.error(`[${this.breaker.name}] ${(err as Error).message}`);
        throw new ServiceUnavailableException(SERVICE_UNAVAILABLE_MESSAGE);
      }
      throw err;
    }
  }

  createPaymentIntent(
    params: CreatePaymentIntentParams,
  ): Promise<Stripe.PaymentIntent> {
    return this.call(() =>
      this.stripe.paymentIntents.create(
        {
          amount: params.amountCents,
          currency: params.currency,
          automatic_payment_methods: { enabled: true },
          metadata: {
            orderId: String(params.orderId),
            userId: String(params.userId),
          },
        },
        { idempotencyKey: params.idempotencyKey },
      ),
    );
  }

  retrievePaymentIntent(id: string): Promise<Stripe.PaymentIntent> {
    return this.call(() => this.stripe.paymentIntents.retrieve(id));
  }

  cancelPaymentIntent(id: string): Promise<Stripe.PaymentIntent> {
    return this.call(() => this.stripe.paymentIntents.cancel(id));
  }

  refundPaymentIntent(
    paymentIntentId: string,
    idempotencyKey: string,
  ): Promise<Stripe.Refund> {
    return this.call(() =>
      this.stripe.refunds.create(
        { payment_intent: paymentIntentId },
        { idempotencyKey },
      ),
    );
  }

  /** Verifica la firma del webhook con el body CRUDO (sin parsear) */
  constructEvent(rawBody: Buffer, signature: string): Stripe.Event {
    if (!this.webhookSecret)
      throw new ServiceUnavailableException(
        'STRIPE_WEBHOOK_SECRET no está configurada',
      );
    return this.stripe.webhooks.constructEvent(
      rawBody,
      signature,
      this.webhookSecret,
    );
  }
}
