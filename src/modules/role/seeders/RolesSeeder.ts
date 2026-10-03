import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { Role } from '../domain/entity/role.entity';

const DEFAULT_ROLES: DeepPartial<Role>[] = [
  { name: 'SUPER_ADMIN' },
  { name: 'ADMIN' },
];

@Injectable()
export class RolesSeeder implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(Role)
    private readonly repo: Repository<Role>,
  ) {}

  async seed(): Promise<void> {
    const existingRoles = await this.repo.find({ select: { name: true } });
    const existingNames = new Set(existingRoles.map(({ name }) => name));
    const missingRoles = DEFAULT_ROLES.filter(
      ({ name }) => name && !existingNames.has(name),
    );

    if (missingRoles.length === 0) return;

    await this.repo
      .createQueryBuilder()
      .insert()
      .into(Role)
      .values(missingRoles)
      .orIgnore()
      .execute();
  }

  async onApplicationBootstrap(): Promise<void> {
    await this.seed();
  }
}
