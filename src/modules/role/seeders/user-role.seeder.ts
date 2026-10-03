import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { DEFAULT_USER_ROLE } from 'src/common/constants/roles';
import { PERMISSIONS } from 'src/common/constants/permissions';
import { Permission } from 'src/modules/permission/domain/entity/permission.entity';
import { Role } from '../domain/entity/role.entity';

/** Lo mínimo que necesita un usuario para publicar productos con imágenes */
const USER_ROLE_PERMISSIONS: string[] = [PERMISSIONS.CREATE_UPLOAD];

/**
 * Garantiza el rol USER (rol por defecto del signup) y sus permisos.
 * Es independiente del orden de PermissionsSeeder: crea los permisos que
 * necesita si aún no existen.
 */
@Injectable()
export class UserRoleSeeder implements OnApplicationBootstrap {
  private readonly logger = new Logger(UserRoleSeeder.name);

  constructor(
    @InjectRepository(Role) private readonly roleRepo: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionRepo: Repository<Permission>,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.roleRepo
      .createQueryBuilder()
      .insert()
      .into(Role)
      .values({ name: DEFAULT_USER_ROLE })
      .orIgnore()
      .execute();

    await this.permissionRepo
      .createQueryBuilder()
      .insert()
      .into(Permission)
      .values(USER_ROLE_PERMISSIONS.map((name) => ({ name })))
      .orIgnore()
      .execute();

    const role = await this.roleRepo.findOne({
      where: { name: DEFAULT_USER_ROLE },
      relations: { permissions: true },
    });
    if (!role) return;

    const current = new Set(role.permissions.map((p) => p.name));
    const missing = USER_ROLE_PERMISSIONS.filter((name) => !current.has(name));
    if (!missing.length) return;

    const permissions = await this.permissionRepo.find({
      where: { name: In(missing) },
    });
    role.permissions = [...role.permissions, ...permissions];
    await this.roleRepo.save(role);
    this.logger.log(
      `Permisos añadidos al rol ${DEFAULT_USER_ROLE}: ${missing.join(', ')}`,
    );
  }
}
