import { BaseEntity } from 'src/common/entity/base';
import { User } from 'src/modules/user/domain/entity/user.entity';
import { Entity, Column, OneToOne } from 'typeorm';

@Entity('uploads')
export class Upload extends BaseEntity {
  @OneToOne(() => User, (user) => user.photo)
  user: User | null = null;

  @Column({ type: 'varchar', unique: true, nullable: false })
  publicId!: string;

  @Column({ type: 'varchar', nullable: false })
  url!: string;

  @Column({ type: 'varchar', nullable: false })
  secureUrl!: string;

  @Column({ type: 'varchar', nullable: true })
  resourceType!: string;

  @Column({ type: 'varchar', nullable: true })
  format!: string;

  @Column({ type: 'varchar', nullable: true })
  originalFilename!: string;

  @Column({ type: 'integer', nullable: true })
  width: number | null = null;

  @Column({ type: 'integer', nullable: true })
  height: number | null = null;

  @Column({ type: 'bigint', nullable: true })
  bytes: number | null = null;

  @Column({ type: 'varchar', nullable: true })
  phash: string | null = null;

  @Column({ type: 'jsonb', nullable: true })
  colors: string[][] | null = null;

  @Column({ type: 'jsonb', nullable: true })
  faces: object[] | null = null;

  @Column({ type: 'jsonb', nullable: true })
  predominant: object | null = null;

  @Column({ type: 'jsonb', nullable: true })
  eager:
    | { url: string; secureUrl: string; width: number; height: number }[]
    | null = null;

  @Column({ type: 'text', array: true, nullable: true })
  tags: string[] | null = null;

  @Column({ type: 'boolean', default: false })
  placeholder: boolean = false;
}
