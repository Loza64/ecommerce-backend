import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional } from 'class-validator';
import BaseQuerys from 'src/common/dto/base-querys.dto';

export class CouponQuerys extends BaseQuerys {
  /** platform: cupones de la plataforma | sellers: cupones de vendedores */
  @IsOptional()
  @IsIn(['platform', 'sellers'])
  scope?: 'platform' | 'sellers';

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  seller?: number;
}
