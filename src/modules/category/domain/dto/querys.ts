import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional } from 'class-validator';
import BaseQuerys from 'src/common/dto/base-querys.dto';
import { ToBoolean } from 'src/common/decorators/dto';

export class CategoryQuerys extends BaseQuerys {
  /** Lista las subcategorías de la categoría indicada */
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  parent?: number;

  /** true => solo categorías raíz */
  @IsOptional()
  @IsBoolean()
  @ToBoolean()
  root?: boolean;
}
