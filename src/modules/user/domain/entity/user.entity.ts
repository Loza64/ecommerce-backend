import { Entity, Column, ManyToOne, JoinColumn, OneToOne } from 'typeorm';
import { BaseEntity } from 'src/common/entity/base';
import { Role } from 'src/modules/role/domain/entity/role.entity';
import { Upload } from 'src/modules/upload/domain/entity/upload.entity';

@Entity('users')
export class User extends BaseEntity {
  @OneToOne(() => Upload, (upload) => upload.user, {
    nullable: true,
    eager: false,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'photo_id' })
  photo: Upload | null = null;

  @Column({ type: 'varchar', unique: true, nullable: false })
  username!: string;

  @Column({ type: 'varchar', nullable: false })
  name!: string;

  @Column({ type: 'varchar', nullable: false })
  surname!: string;

  @Column({ type: 'varchar', unique: true, nullable: false })
  email!: string;

  @Column({ type: 'varchar', nullable: false })
  password!: string;

  @Column({ type: 'boolean', default: false })
  blocked: boolean = false;

  @ManyToOne(() => Role, { nullable: true, eager: false, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'role_id' })
  role: Role | null = null;
}
