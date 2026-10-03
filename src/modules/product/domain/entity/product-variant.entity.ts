import { Check, Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from 'src/common/entity/base';
import { numericTransformer } from 'src/common/transformers/numeric.transformer';
import { Product } from './product.entity';

export type VariantAttributes = Record<string, string | number | boolean>;

@Entity('product_variants')
@Index('uq_product_variants_sku', ['sku'], {
  unique: true,
  where: '"deletedAt" IS NULL',
})
@Check('chk_product_variants_price', '"price" >= 0')
@Check('chk_product_variants_stock', '"stockQuantity" >= 0')
export class ProductVariant extends BaseEntity {
  @ManyToOne(() => Product, (product) => product.variants, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'product_id' })
  product!: Product;

  @Column({ type: 'varchar', length: 100, nullable: false })
  sku!: string;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: false,
    transformer: numericTransformer,
  })
  price!: number;

  @Column({ type: 'int', nullable: false, default: 0 })
  stockQuantity: number = 0;

  /** Ej: { "Talla": "M", "Color": "Rojo" } */
  @Column({ type: 'jsonb', nullable: false, default: () => "'{}'" })
  attributes: VariantAttributes = {};
}
