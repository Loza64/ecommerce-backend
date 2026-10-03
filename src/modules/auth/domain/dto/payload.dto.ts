import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { PartialType, OmitType } from '@nestjs/mapped-types';

export class ChangePasswordDto {
  @IsString() @IsNotEmpty() currentPassword!: string;
  @IsString() @IsNotEmpty() @MinLength(6) newPassword!: string;
}

export class LoginDto {
  @IsNotEmpty({ message: 'El username es obligatorio' })
  @IsString()
  username!: string;

  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  @IsString()
  password!: string;
}

export class SignUpDto {
  @IsNotEmpty({ message: 'El username es obligatorio' })
  @IsString()
  username!: string;

  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @IsString()
  name!: string;

  @IsNotEmpty({ message: 'El apellido es obligatorio' })
  @IsString()
  surname!: string;

  @IsNotEmpty({ message: 'El email es obligatorio' })
  @IsEmail({}, { message: 'El email no es válido' })
  email!: string;

  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password!: string;
}

export class UpdateProfileDto extends PartialType(
  OmitType(SignUpDto, ['password'] as const),
) {}

export class RefreshTokenDto {
  @IsNotEmpty({ message: 'El refresh token es obligatorio' })
  @IsString()
  refreshToken!: string;
}
