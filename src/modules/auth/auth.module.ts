import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Permission } from '../permission/domain/entity/permission.entity';
import { Role } from '../role/domain/entity/role.entity';
import { User } from '../user/domain/entity/user.entity';
import { CryptoModule } from 'src/integrations/crypto/crypto.module';
import { RefreshTokenModule } from '../refresh_token/refresh_token.module';
import { AuthService } from './services/auth.service';
import { AuthController } from './controller/auth.controller';
import { JwtStrategy } from 'src/security/jwt/jwt.strategy';

@Module({
  imports: [
    ConfigModule,
    PassportModule,
    CryptoModule,
    RefreshTokenModule,
    TypeOrmModule.forFeature([Permission, Role, User]),
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
