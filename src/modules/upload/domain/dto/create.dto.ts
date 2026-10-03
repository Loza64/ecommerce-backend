import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsArray, IsOptional, IsString } from 'class-validator';

const DEFAULT_TAGS = ['general'];

function parseTagsValue(value: unknown): string[] {
  if (!value) return DEFAULT_TAGS;

  if (typeof value === 'string') {
    const parsed = value
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    return parsed.length ? parsed : DEFAULT_TAGS;
  }

  if (Array.isArray(value)) {
    const parsed = value.map(String).filter(Boolean);
    return parsed.length ? parsed : DEFAULT_TAGS;
  }

  return DEFAULT_TAGS;
}

export class CreateUploadDto {
  @ApiPropertyOptional({
    type: 'array',
    items: { type: 'string' },
    description: 'Lista de etiquetas asociadas al archivo',
    example: ['general', 'imagenes'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => parseTagsValue(value))
  tags: string[] = DEFAULT_TAGS;
}
