import { IsOptional, IsString } from 'class-validator';

export class PermissionUpdateDto {
  @IsOptional()
  @IsString()
  title?: string | null;
}
