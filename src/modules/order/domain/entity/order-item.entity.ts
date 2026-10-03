import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from 'src/common/entity/base';
import { numericTransformer } from 'src/common/transformers/numeric.transformer';
import { User } from 'src/modules/user/domain/entity/user.entity';
import * as productVariantEntity from 'src/modules/product/domain/entity/product-variant.entity';
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

  @ManyToOne(() => productVariantEntity.ProductVariant, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'product_variant_id' })
  productVariant: productVariantEntity.ProductVariant | null = null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'seller_id' })
  seller: User | null = null;

  @Column({ type: 'varchar', length: 200 })
  productName!: string;

  @Column({ type: 'varchar', length: 100 })
  sku!: string;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  attributes: productVariantEntity.VariantAttributes = {};

  @Column({ type: 'int' })
  quantity!: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: numericTransformer,
  })
  unitPrice!: number;
}
