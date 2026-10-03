import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StripeModule } from 'src/integrations/stripe/stripe.module';
import { SchedulerModule } from 'src/shared/scheduler/scheduler.module';
import { Cart } from '../cart/domain/entity/cart.entity';
import { CartItem } from '../cart/domain/entity/cart-item.entity';
import { Order } from './domain/entity/order.entity';
import { OrderItem } from './domain/entity/order-item.entity';
import { OrderService } from './service/order.service';
import { OrderController } from './controller/order.controller';
import { PendingOrdersExpirationJob } from './jobs/pending-orders-expiration.job';

@Module({
  imports: [
    ConfigModule,
    StripeModule,
    SchedulerModule,
    TypeOrmModule.forFeature([Order, OrderItem, Cart, CartItem]),
  ],
  providers: [OrderService, PendingOrdersExpirationJob],
  controllers: [OrderController],
  exports: [OrderService],
})
export class OrderModule {}
