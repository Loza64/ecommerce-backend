import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { CryptoService } from 'src/integrations/crypto/crypto.service';
import { Role } from 'src/modules/role/domain/entity/role.entity';
import { RolesSeeder } from 'src/modules/role/seeders/RolesSeeder';
import { User } from '../domain/entity/user.entity';
import { SuperAdminSeeder } from './super-admin.seeder';

describe('SuperAdminSeeder', () => {
  let seeder: SuperAdminSeeder;
  let userRepository: {
    findOne: jest.Mock<(...args: unknown[]) => Promise<unknown>>;
    create: jest.Mock<(...args: unknown[]) => unknown>;
    save: jest.Mock<(...args: unknown[]) => Promise<unknown>>;
  };
  let roleRepository: {
    findOneBy: jest.Mock<(...args: unknown[]) => Promise<unknown>>;
  };
  let rolesSeeder: {
    seed: jest.Mock<(...args: unknown[]) => Promise<unknown>>;
  };
  let cryptoService: {
    encrypt: jest.Mock<(...args: unknown[]) => Promise<unknown>>;
  };

  beforeEach(() => {
    userRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };
    roleRepository = { findOneBy: jest.fn() };
    rolesSeeder = { seed: jest.fn() };
    cryptoService = { encrypt: jest.fn() };

    seeder = new SuperAdminSeeder(
      userRepository as unknown as Repository<User>,
      roleRepository as unknown as Repository<Role>,
      rolesSeeder as unknown as RolesSeeder,
      {
        get: jest.fn(
          (key: string) =>
            ({
              SUPER_ADMIN_EMAIL: 'admin@example.com',
              SUPER_ADMIN_PASSWORD: 'password',
              SUPER_ADMIN_USERNAME: 'admin',
            })[key],
        ),
      } as unknown as ConfigService,
      cryptoService as unknown as CryptoService,
    );
  });

  it('seeds roles before creating the super admin', async () => {
    const role = { id: 1, name: 'SUPER_ADMIN' } as Role;
    const user = { id: 1 } as User;
    userRepository.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);
    roleRepository.findOneBy.mockResolvedValue(role);
    cryptoService.encrypt.mockResolvedValue('hashed-password');
    userRepository.create.mockReturnValue(user);
    userRepository.save.mockResolvedValue(user);

    await seeder.onApplicationBootstrap();

    expect(rolesSeeder.seed).toHaveBeenCalledTimes(1);
    expect(roleRepository.findOneBy).toHaveBeenCalledWith({
      name: 'SUPER_ADMIN',
    });
    expect(userRepository.save).toHaveBeenCalledWith(user);
    expect(rolesSeeder.seed.mock.invocationCallOrder[0]).toBeLessThan(
      roleRepository.findOneBy.mock.invocationCallOrder[0],
    );
  });

  it('stops without creating a user when a super admin already exists', async () => {
    userRepository.findOne.mockResolvedValue({ id: 1 });

    await seeder.onApplicationBootstrap();

    expect(rolesSeeder.seed).not.toHaveBeenCalled();
    expect(userRepository.create).not.toHaveBeenCalled();
  });
});
