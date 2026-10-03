import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';
import { ToBoolean } from '../decorators/dto';
import { ApiProperty } from '@nestjs/swagger';

export default class BaseQuerys {
  @ApiProperty({
    description:
      'Campos por los cuales ordenar, formato "campo,asc" o "campo,desc"',
    example: ['id,desc', 'name,asc'],
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Matches(/^\w+,(asc|desc)$/i, {
    each: true,
    message: 'sort debe tener formato campo,asc',
  })
  sort?: string[];

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  page: number = 1;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(1)
  @Max(500)
  pageSize: number = 50;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsBoolean()
  @ToBoolean()
  deleted?: boolean = false;
}
