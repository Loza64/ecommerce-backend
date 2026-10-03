import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import JwtPayload from 'src/common/models/jwt.payload';
import { User } from 'src/modules/user/domain/entity/user.entity';
import { AuthService } from 'src/modules/auth/services/auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly authService: AuthService,
    configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
      issuer: 'app-name',
      audience: ['web', 'mobile'],
    });
  }

  async validate({ sub }: JwtPayload): Promise<User> {
    const user = await this.authService.profile(sub);

    if (!user) {
      throw new UnauthorizedException(
        'The account associated with this token no longer exists.',
      );
    }

    if (user.deletedAt !== null) {
      throw new UnauthorizedException('This account is currently deactivated.');
    }

    if (user.blocked) {
      throw new UnauthorizedException(
        'This account has been blocked. Please contact support.',
      );
    }

    if (!user.role) {
      throw new UnauthorizedException('This account has been without access');
    }

    if (!user.role.active) {
      throw new UnauthorizedException('This account role has been disabled');
    }

    return user;
  }
}
