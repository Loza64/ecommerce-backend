import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Upload } from 'src/modules/upload/domain/entity/upload.entity';
import { Product } from './product.entity';

/**
 * Tabla intermedia ordenada Product <-> Upload.
 * `position` 0 = imagen principal. Un upload solo puede pertenecer
 * a un producto.
 */
@Entity('product_images')
@Index('uq_product_images_upload', ['upload'], { unique: true })
export class ProductImage {
  @PrimaryGeneratedColumn()
  id: number = 0;

  @ManyToOne(() => Product, (product) => product.images, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'product_id' })
  product!: Product;

  @ManyToOne(() => Upload, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'upload_id' })
  upload!: Upload;

  @Column({ type: 'int', default: 0 })
  position: number = 0;
}
