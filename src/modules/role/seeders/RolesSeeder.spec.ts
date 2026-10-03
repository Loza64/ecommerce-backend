import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RolesSeeder } from './RolesSeeder';
import { Role } from '../domain/entity/role.entity';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

describe('RolesSeeder', () => {
  let seeder: RolesSeeder;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesSeeder,
        {
          provide: getRepositoryToken(Role),
          useValue: {
            upsert: jest.fn(),
          },
        },
      ],
    }).compile();

    seeder = module.get<RolesSeeder>(RolesSeeder);
  });

  it('should be defined', () => {
    expect(seeder).toBeDefined();
  });
});
