import { Body, Controller, Get, HttpCode, Patch, Post } from '@nestjs/common';
import { AuthResponseDto } from '../domain/dto/response.dto';
import { User } from 'src/modules/user/domain/entity/user.entity';
import { Profile } from 'src/common/decorators/profile';
import {
  ChangePasswordDto,
  LoginDto,
  RefreshTokenDto,
  SignUpDto,
  UpdateProfileDto,
} from '../domain/dto/payload.dto';
import { UserMapper } from 'src/modules/user/domain/mappers/user.mapper';
import { UserResponseDto } from 'src/modules/user/domain/dto/response.dto';
import { AuthService } from '../services/auth.service';
import { Public } from 'src/common/decorators/public';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @Public()
  async login(@Body() data: LoginDto): Promise<AuthResponseDto> {
    const session = await this.authService.login(data.username, data.password);
    return {
      token: session.token,
      refreshToken: session.refreshToken,
      data: UserMapper.toResponse(session.data as User),
    };
  }

  @Post('signup')
  @Public()
  async signUp(@Body() data: SignUpDto): Promise<AuthResponseDto> {
    const session = await this.authService.signUp(data);
    return {
      token: session.token,
      refreshToken: session.refreshToken,
      data: UserMapper.toResponse(session.data as User),
    };
  }

  @Post('refresh')
  @Public()
  async refresh(@Body() data: RefreshTokenDto): Promise<AuthResponseDto> {
    const session = await this.authService.refresh(data.refreshToken);
    return {
      token: session.token,
      refreshToken: session.refreshToken,
      data: UserMapper.toResponse(session.data as User),
    };
  }

  @Post('logout')
  @Public()
  @HttpCode(204)
  async logout(@Body() data: RefreshTokenDto): Promise<void> {
    await this.authService.logout(data.refreshToken);
  }

  @Get('profile')
  profile(@Profile() profile: User): UserResponseDto {
    return UserMapper.toResponse(profile);
  }

  @Patch('profile')
  async updateProfile(
    @Profile() profile: User,
    @Body() data: UpdateProfileDto,
  ): Promise<UserResponseDto> {
    const updated = await this.authService.updateProfile(profile.id, data);
    return UserMapper.toResponse(updated);
  }

  @Patch('profile/password')
  async updatePassword(
    @Profile() profile: User,
    @Body() data: ChangePasswordDto,
  ): Promise<UserResponseDto> {
    const updated = await this.authService.updatePassword(profile.id, data);
    return UserMapper.toResponse(updated);
  }
}
