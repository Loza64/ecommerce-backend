import { Module } from '@nestjs/common';
import { Role } from './domain/entity/role.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Permission } from '../permission/domain/entity/permission.entity';
import { PermissionModule } from '../permission/permission.module';
import { RolesSeeder } from './seeders/RolesSeeder';
import { UserRoleSeeder } from './seeders/user-role.seeder';
import { RoleService } from './service/role.service';
import { RoleController } from './controller/role.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Role, Permission]), PermissionModule],
  providers: [RoleService, RolesSeeder, UserRoleSeeder],
  exports: [RolesSeeder],
  controllers: [RoleController],
})
export class RoleModule {}
