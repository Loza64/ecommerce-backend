import { Entity, Column, Unique, PrimaryGeneratedColumn } from 'typeorm';

@Entity('permissions')
@Unique(['name'])
export class Permission {
  @PrimaryGeneratedColumn()
  id: number = 0;

  @Column({ type: 'varchar' })
  name!: string;

  @Column({ type: 'varchar', nullable: true })
  title!: string | null;
}
