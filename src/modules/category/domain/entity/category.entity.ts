import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from 'src/common/entity/base';

@Entity('categories')
export class Category extends BaseEntity {
  @Column({ type: 'varchar', length: 100, nullable: false })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description: string | null = null;

  /** null => categoría raíz; con valor => subcategoría */
  @ManyToOne(() => Category, (category) => category.children, {
    nullable: true,
    eager: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'parent_id' })
  parent: Category | null = null;

  @OneToMany(() => Category, (category) => category.parent)
  children!: Category[];
}
