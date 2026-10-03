import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional } from 'class-validator';
import BaseQuerys from 'src/common/dto/base-querys.dto';
import { ToBoolean } from 'src/common/decorators/dto';

export class querys extends BaseQuerys {
  @IsOptional()
  @IsBoolean()
  @ToBoolean()
  blocked?: boolean;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  role?: number;
}
