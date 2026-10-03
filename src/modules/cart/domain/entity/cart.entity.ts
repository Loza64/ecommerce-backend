import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { BaseEntity } from 'src/common/entity/base';
import { User } from 'src/modules/user/domain/entity/user.entity';
import { CartItem } from './cart-item.entity';
import { CartCoupon } from './cart-coupon.entity';

export enum CartStatus {
  ACTIVE = 'active',
  ABANDONED = 'abandoned',
  CONVERTED = 'converted',
}

/** Un usuario solo puede tener un carrito activo a la vez */
@Entity('carts')
@Index('uq_carts_active_per_user', ['user'], {
  unique: true,
  where: `"status" = 'active' AND "user_id" IS NOT NULL`,
})
export class Cart extends BaseEntity {
  /** Nullable para carritos anónimos */
  @ManyToOne(() => User, { nullable: true, eager: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User | null = null;

  @Column({ type: 'enum', enum: CartStatus, default: CartStatus.ACTIVE })
  status: CartStatus = CartStatus.ACTIVE;

  @OneToMany(() => CartItem, (item) => item.cart)
  items!: CartItem[];

  @OneToMany(() => CartCoupon, (cartCoupon) => cartCoupon.cart)
  coupons!: CartCoupon[];
}
