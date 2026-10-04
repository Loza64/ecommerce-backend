import { PartialType } from '@nestjs/mapped-types';
import { Transform, Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  IsOptional,
} from 'class-validator';
import { DiscountType } from '../entity/coupon.entity';

export class CreateCouponDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(50)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @Matches(/^[A-Z0-9_-]+$/, {
    message: 'code solo puede contener letras, números, guion y guion bajo',
  })
  code!: string;

  @IsEnum(DiscountType) discountType!: DiscountType;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(99999999)
  discountValue!: number;

  @Type(() => Date)
  @IsDate()
  expirationDate!: Date;

  /** Usos totales permitidos. Omitir o null = sin límite */
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1_000_000)
  maxUses?: number | null;

  /** Usos permitidos por comprador. Omitir o null = sin límite */
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1_000_000)
  maxUsesPerUser?: number | null;
}

export class UpdateCouponDto extends PartialType(CreateCouponDto) {}

export class ApplyCouponDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  code!: string;
}
