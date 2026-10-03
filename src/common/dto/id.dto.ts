import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty } from 'class-validator';

export default class IdDto {
  @ApiPropertyOptional({ type: Number })
  @IsNotEmpty()
  @IsInt()
  @Type(() => Number)
  id!: number;
}
