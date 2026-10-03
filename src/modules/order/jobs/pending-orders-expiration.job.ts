import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NodeCronScheduler } from 'src/shared/scheduler/node-cron.scheduler';
import { CronJob } from 'src/shared/scheduler/scheduler.port';
import { OrderService } from '../service/order.service';

/**
 * Cancela los pedidos que siguen en `pending_payment` pasado el tiempo
 * máximo: cancela el PaymentIntent, devuelve el stock y reactiva el carrito.
 */
@Injectable()
export class PendingOrdersExpirationJob implements CronJob, OnModuleInit {
  private readonly logger = new Logger(PendingOrdersExpirationJob.name);

  readonly name = 'pending-orders-expiration';
  readonly cronExpression: string;
  readonly preventOverlap = true;

  private readonly ttlMinutes: number;

  constructor(
    private readonly orderService: OrderService,
    private readonly scheduler: NodeCronScheduler,
    config: ConfigService,
  ) {
    this.cronExpression =
      config.get<string>('PENDING_ORDERS_EXPIRATION_CRON') ?? '*/5 * * * *';
    this.ttlMinutes = Number(config.get('ORDER_PAYMENT_TTL_MINUTES')) || 30;
  }

  onModuleInit(): void {
    this.scheduler.register(this);
  }

  async run(): Promise<void> {
    const olderThan = new Date(Date.now() - this.ttlMinutes * 60_000);
    const { scanned, cancelled, failed } =
      await this.orderService.expirePendingOrders(olderThan);

    if (scanned)
      this.logger.log(
        `Pedidos sin pagar: ${scanned} escaneados, ${cancelled} cancelados, ${failed} fallidos`,
      );
  }
}
