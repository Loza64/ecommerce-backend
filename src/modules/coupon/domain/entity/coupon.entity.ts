import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from 'src/common/entity/base';
import { numericTransformer } from 'src/common/transformers/numeric.transformer';
import { User } from 'src/modules/user/domain/entity/user.entity';

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

  @ManyToOne(() => User, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'seller_id' })
  seller: User | null = null;

  @Column({
    name: 'seller_id',
    type: 'int',
    nullable: true,
  })
  sellerId!: number | null;

  @Column({ type: 'int', nullable: true })
  maxUses: number | null = null;

  @Column({ type: 'int', nullable: true })
  maxUsesPerUser: number | null = null;
}
