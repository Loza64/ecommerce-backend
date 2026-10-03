import { Module } from '@nestjs/common';
import { Permission } from './domain/entity/permission.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PermissionsSeeder } from './seeders/permissions.seeder';
import { PermissionService } from './service/permission.service';
import { PermissionController } from './controller/permission.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Permission])],
  providers: [PermissionService, PermissionsSeeder],
  controllers: [PermissionController],
  exports: [PermissionService],
})
export class PermissionModule {}
