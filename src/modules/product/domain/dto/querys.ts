import { Type } from 'class-transformer';
import { IsInt, IsOptional } from 'class-validator';
import BaseQuerys from 'src/common/dto/base-querys.dto';

export class ProductQuerys extends BaseQuerys {
  /** Incluye productos de sus subcategorías */
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  category?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  seller?: number;
}
