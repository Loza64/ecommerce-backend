import { OmitType, PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsDefined,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import IdDto from 'src/common/dto/id.dto';
import { IsFlatAttributes } from 'src/common/validators/flat-attributes.validator';
import type { VariantAttributes } from '../entity/product-variant.entity';

export class CreateVariantDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Matches(/^[A-Za-z0-9_.-]+$/, {
    message:
      'sku solo puede contener letras, números, punto, guion y guion bajo',
  })
  sku!: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(99999999)
  price!: number;

  @IsInt()
  @Min(0)
  @Max(1000000)
  stockQuantity!: number;

  @IsOptional()
  @IsFlatAttributes()
  attributes?: VariantAttributes;
}

export class UpdateVariantDto extends PartialType(CreateVariantDto) {}

export class CreateProductDto {
  @IsString() @IsNotEmpty() @MaxLength(200) name!: string;

  @IsString() @IsNotEmpty() @MaxLength(5000) description!: string;

  /** { id: number } */
  @IsDefined()
  @ValidateNested()
  @Type(() => IdDto)
  category!: IdDto;

  /** [{ id: number }] ids de uploads; el orden define la imagen principal */
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  @ArrayUnique((o: IdDto) => o.id)
  @ValidateNested({ each: true })
  @Type(() => IdDto)
  images!: IdDto[];

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => CreateVariantDto)
  variants!: CreateVariantDto[];
}

/** Las variantes se gestionan en /products/:id/variants */
export class UpdateProductDto extends PartialType(
  OmitType(CreateProductDto, ['variants'] as const),
) {}
