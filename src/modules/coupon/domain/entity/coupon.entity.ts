import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from 'src/common/entity/base';
import { numericTransformer } from 'src/common/transformers/numeric.transformer';

export enum DiscountType {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed',
}

@Entity('coupons')
@Index('uq_coupons_code', ['code'], {
  unique: true,
  where: '"deletedAt" IS NULL',
})
export class Coupon extends BaseEntity {
  @Column({ type: 'varchar', length: 50, nullable: false })
  code!: string;

  @Column({ type: 'enum', enum: DiscountType, nullable: false })
  discountType!: DiscountType;

  /** percentage: 0-100 | fixed: monto en la moneda de la tienda */
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: false,
    transformer: numericTransformer,
  })
  discountValue!: number;

  @Column({ type: 'timestamptz', nullable: false })
  expirationDate!: Date;
}
