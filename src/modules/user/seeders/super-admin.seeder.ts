import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CryptoService } from 'src/integrations/crypto/crypto.service';
import { Role } from 'src/modules/role/domain/entity/role.entity';
import { RolesSeeder } from 'src/modules/role/seeders/RolesSeeder';
import { User } from '../domain/entity/user.entity';

@Injectable()
export class SuperAdminSeeder implements OnApplicationBootstrap {
  private readonly logger = new Logger(SuperAdminSeeder.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    private readonly rolesSeeder: RolesSeeder,
    private readonly configService: ConfigService,
    private readonly cryptoService: CryptoService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const email = this.configService.get<string>('SUPER_ADMIN_EMAIL');
    const password = this.configService.get<string>('SUPER_ADMIN_PASSWORD');
    const username = this.configService.get<string>('SUPER_ADMIN_USERNAME');

    if (!email || !password || !username) {
      this.logger.warn(
        'SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD y SUPER_ADMIN_USERNAME son requeridos para crear el super admin',
      );
      return;
    }

    const existingSuperAdmin = await this.userRepository.findOne({
      where: { role: { name: 'SUPER_ADMIN' } },
      relations: { role: true },
      withDeleted: true,
    });

    if (existingSuperAdmin) return;

    await this.rolesSeeder.seed();

    const conflictingUser = await this.userRepository.findOne({
      where: [{ email }, { username }],
      withDeleted: true,
    });

    if (conflictingUser) return;

    const superAdminRole = await this.roleRepository.findOneBy({
      name: 'SUPER_ADMIN',
    });

    if (!superAdminRole) {
      throw new Error(
        'No existe el rol SUPER_ADMIN para crear el usuario inicial',
      );
    }

    const user = this.userRepository.create({
      username,
      name: 'Super',
      surname: 'Admin',
      email,
      password: await this.cryptoService.encrypt(password),
      role: superAdminRole,
    });

    await this.userRepository.save(user);
    this.logger.log(`Usuario super admin creado: ${email}`);
  }
}
