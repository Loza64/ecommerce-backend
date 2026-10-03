import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { BaseEntity } from 'src/common/entity/base';
import { numericTransformer } from 'src/common/transformers/numeric.transformer';
import { User } from 'src/modules/user/domain/entity/user.entity';
import { Cart } from 'src/modules/cart/domain/entity/cart.entity';
import { OrderItem } from './order-item.entity';

export enum OrderStatus {
  /** Stock reservado, esperando el pago en Stripe */
  PENDING_PAYMENT = 'pending_payment',
  PAID = 'paid',
  /** Cancelado por el comprador, por expiración o por Stripe; stock devuelto */
  CANCELLED = 'cancelled',
}

@Entity('orders')
@Index('uq_orders_stripe_payment_intent', ['stripePaymentIntentId'], {
  unique: true,
})
export class Order extends BaseEntity {
  @ManyToOne(() => User, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'buyer_id' })
  buyer!: User;

  @ManyToOne(() => Cart, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'cart_id' })
  cart: Cart | null = null;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING_PAYMENT,
  })
  status: OrderStatus = OrderStatus.PENDING_PAYMENT;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: numericTransformer,
  })
  subtotal!: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    transformer: numericTransformer,
  })
  discountTotal: number = 0;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: numericTransformer,
  })
  total!: number;

  @Column({ type: 'varchar', length: 3 })
  currency!: string;

  /** Snapshot del cupón aplicado */
  @Column({ type: 'varchar', length: 50, nullable: true })
  couponCode: string | null = null;

  @Column({ type: 'varchar', nullable: true })
  stripePaymentIntentId: string | null = null;

  @Column({ type: 'timestamptz', nullable: true })
  paidAt: Date | null = null;

  @OneToMany(() => OrderItem, (item) => item.order)
  items!: OrderItem[];
}
