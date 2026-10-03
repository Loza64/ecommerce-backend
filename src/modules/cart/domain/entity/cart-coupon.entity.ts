import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Coupon } from 'src/modules/coupon/domain/entity/coupon.entity';
import { Cart } from './cart.entity';

/**
 * PK compuesta (cart_id, coupon_id). Por regla de negocio un carrito
 * aplica un único cupón a la vez (ver CartService.applyCoupon).
 */
@Entity('cart_coupons')
export class CartCoupon {
  @PrimaryColumn({ name: 'cart_id', type: 'int' })
  cartId!: number;

  @PrimaryColumn({ name: 'coupon_id', type: 'int' })
  couponId!: number;

  @ManyToOne(() => Cart, (cart) => cart.coupons, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cart_id' })
  cart!: Cart;

  @ManyToOne(() => Coupon, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'coupon_id' })
  coupon!: Coupon;
}
