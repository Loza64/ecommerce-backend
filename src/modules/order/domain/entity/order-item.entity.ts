import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from 'src/common/entity/base';
import { numericTransformer } from 'src/common/transformers/numeric.transformer';
import { User } from 'src/modules/user/domain/entity/user.entity';
import {
  ProductVariant,
  type VariantAttributes,
} from 'src/modules/product/domain/entity/product-variant.entity';
import { Order } from './order.entity';

/** Línea del pedido con snapshot del producto al momento de la compra */
@Entity('order_items')
export class OrderItem extends BaseEntity {
  @ManyToOne(() => Order, (order) => order.items, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'order_id' })
  order!: Order;

  @ManyToOne(() => ProductVariant, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'product_variant_id' })
  productVariant: ProductVariant | null = null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'seller_id' })
  seller: User | null = null;

  @Column({ type: 'varchar', length: 200 })
  productName!: string;

  @Column({ type: 'varchar', length: 100 })
  sku!: string;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  attributes: VariantAttributes = {};

  @Column({ type: 'int' })
  quantity!: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: numericTransformer,
  })
  unitPrice!: number;

  /**
   * Descuento de esta línea cuando el cupón es de vendedor (lo asume él).
   * Con cupones de la plataforma es 0: el vendedor cobra el precio completo.
   */
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    transformer: numericTransformer,
  })
  discountAmount: number = 0;
}
