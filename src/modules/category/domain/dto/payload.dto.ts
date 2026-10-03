import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import IdDto from 'src/common/dto/id.dto';

export class CreateCategoryDto {
  @IsString() @IsNotEmpty() @MaxLength(100) name!: string;

  @IsOptional() @IsString() @MaxLength(1000) description?: string;

  /** Si se envía, la categoría es una subcategoría de `parent`. */
  @IsOptional()
  @ValidateNested()
  @Type(() => IdDto)
  parent?: IdDto;
}

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}
