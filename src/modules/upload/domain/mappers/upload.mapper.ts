import { Upload } from '../entity/upload.entity';
import { PaginationParser } from 'src/common/parser/pagination.parser';
import { PaginatedResponseDto } from 'src/common/dto/paginated-response.dto';
import { UploadResponseDto } from '../dto/response.dto';

export class UploadMapper {
  static toResponse(entity: Upload): UploadResponseDto {
    return {
      id: entity.id,
      url: entity.url,
      secureUrl: entity.secureUrl,
      resourceType: entity.resourceType,
      format: entity.format,
      originalFilename: entity.originalFilename,
      width: entity.width,
      height: entity.height,
      bytes: entity.bytes,
      tags: entity.tags,
      eager: entity.eager,
    };
  }

  static toResponseList(entities: Upload[]): UploadResponseDto[] {
    return entities.map((e) => this.toResponse(e));
  }

  static toPaginatedResponse(
    pagination: PaginationParser<Upload>,
  ): PaginatedResponseDto<UploadResponseDto> {
    return new PaginatedResponseDto(
      this.toResponseList(pagination.data),
      pagination.pagination,
    );
  }
}
