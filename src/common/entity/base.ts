import {
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

export abstract class BaseEntity {
  @PrimaryGeneratedColumn()
  id: number = 0;

  @CreateDateColumn({ type: 'timestamptz', select: false })
  createdAt: Date = new Date();

  @UpdateDateColumn({ type: 'timestamptz', select: false })
  updatedAt: Date = new Date();

  @DeleteDateColumn({ type: 'timestamptz', nullable: true, default: null })
  deletedAt: Date | null = null;
}
