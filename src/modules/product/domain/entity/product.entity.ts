import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from 'src/common/entity/base';
import { Category } from 'src/modules/category/domain/entity/category.entity';
import { User } from 'src/modules/user/domain/entity/user.entity';
import { ProductVariant } from './product-variant.entity';
import { ProductImage } from './product-image.entity';

@Entity('products')
export class Product extends BaseEntity {
  @Column({ type: 'varchar', length: 200, nullable: false })
  name!: string;

  @Column({ type: 'text', nullable: false })
  description!: string;

  @ManyToOne(() => Category, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'category_id' })
  category!: Category;

  /** Usuario que publica y vende el producto */
  @ManyToOne(() => User, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'seller_id' })
  seller!: User;

  @OneToMany(() => ProductVariant, (variant) => variant.product)
  variants!: ProductVariant[];

  @OneToMany(() => ProductImage, (image) => image.product)
  images!: ProductImage[];
}
