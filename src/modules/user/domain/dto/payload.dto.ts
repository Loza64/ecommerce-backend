import {
  IsBoolean,
  IsDefined,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PartialType, OmitType } from '@nestjs/mapped-types';
import IdDto from 'src/common/dto/id.dto';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(20)
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'username solo puede contener letras, números y guion bajo',
  })
  username?: string;

  @IsString() @IsNotEmpty() name?: string;

  @IsString() @IsNotEmpty() surname?: string;

  @IsEmail() @IsNotEmpty() email?: string;

  @IsString() @IsNotEmpty() @MinLength(6) password!: string;

  @IsBoolean() @IsNotEmpty() blocked: boolean = false;

  @ValidateNested() @Type(() => IdDto) @IsDefined() role!: IdDto;
  @ValidateNested() @Type(() => IdDto) @IsOptional() photo?: IdDto;
}

export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['password'] as const),
) {}
