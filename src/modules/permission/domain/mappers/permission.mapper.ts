import { Permission } from '../entity/permission.entity';
import { PaginationParser } from 'src/common/parser/pagination.parser';
import { PaginatedResponseDto } from 'src/common/dto/paginated-response.dto';
import { PermissionResponseDto } from '../dto/response.dto';

export class PermissionMapper {
  static toResponse(entity: Permission): PermissionResponseDto {
    return {
      id: entity.id,
      name: entity.name,
      title: entity.title,
    };
  }

  static toResponseList(entities: Permission[]): PermissionResponseDto[] {
    return entities.map((e) => this.toResponse(e));
  }

  static toPaginatedResponse(
    pagination: PaginationParser<Permission>,
  ): PaginatedResponseDto<PermissionResponseDto> {
    return new PaginatedResponseDto(
      this.toResponseList(pagination.data),
      pagination.pagination,
    );
  }
}
