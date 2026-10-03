import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './domain/entity/user.entity';
import { Role } from '../role/domain/entity/role.entity';
import { CryptoModule } from 'src/integrations/crypto/crypto.module';
import { RoleModule } from '../role/role.module';
import { UploadModule } from '../upload/upload.module';
import { UserService } from './service/user.service';
import { UserController } from './controller/user.controller';
import { SuperAdminSeeder } from './seeders/super-admin.seeder';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role]),
    CryptoModule,
    RoleModule,
    UploadModule,
  ],
  providers: [UserService, SuperAdminSeeder],
  controllers: [UserController],
})
export class UserModule {}
