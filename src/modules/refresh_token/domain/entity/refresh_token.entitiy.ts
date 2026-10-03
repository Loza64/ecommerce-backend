import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from 'src/common/entity/base';
import { User } from 'src/modules/user/domain/entity/user.entity';

@Entity('refresh_tokens')
export class RefreshToken extends BaseEntity {
  @Column({ type: 'varchar', unique: true, nullable: false })
  @Index()
  token!: string; // hash sha256 del refresh token

  @Column({ type: 'varchar', nullable: false })
  @Index()
  familyId!: string; // agrupa todos los tokens derivados del mismo login

  @Column({ type: 'boolean', default: false })
  used: boolean = false;

  @Column({ type: 'boolean', default: false })
  revoked: boolean = false; // true si se detectó reuso o se cerró sesión

  @Column({ type: 'timestamptz', nullable: false })
  expiresAt!: Date;

  @ManyToOne(() => User, { nullable: false, eager: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;
}
