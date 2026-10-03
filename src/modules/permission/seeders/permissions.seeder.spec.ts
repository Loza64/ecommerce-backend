import { Test, TestingModule } from '@nestjs/testing';
import { PermissionsSeeder } from './permissions.seeder';
import { PermissionService } from '../service/permission.service';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

describe('PermissionsSeeder', () => {
  let seeder: PermissionsSeeder;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionsSeeder,
        {
          provide: PermissionService,
          useValue: {
            upsert: jest.fn(),
          },
        },
      ],
    }).compile();

    seeder = module.get<PermissionsSeeder>(PermissionsSeeder);
  });

  it('should be defined', () => {
    expect(seeder).toBeDefined();
  });
});
