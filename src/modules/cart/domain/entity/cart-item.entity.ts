import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from 'src/common/entity/base';
import { numericTransformer } from 'src/common/transformers/numeric.transformer';
import { ProductVariant } from 'src/modules/product/domain/entity/product-variant.entity';
import { Cart } from './cart.entity';

@Entity('cart_items')
@Index('uq_cart_items_cart_variant', ['cart', 'productVariant'], {
  unique: true,
})
export class CartItem extends BaseEntity {
  @ManyToOne(() => Cart, (cart) => cart.items, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'cart_id' })
  cart!: Cart;

  @ManyToOne(() => ProductVariant, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_variant_id' })
  productVariant!: ProductVariant;

  @Column({ type: 'int', nullable: false })
  quantity!: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: false,
    transformer: numericTransformer,
  })
  priceAtAddition!: number;
}
