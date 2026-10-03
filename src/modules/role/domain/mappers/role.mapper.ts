import { Role } from '../entity/role.entity';
import { PermissionMapper } from 'src/modules/permission/domain/mappers/permission.mapper';
import { PaginationParser } from 'src/common/parser/pagination.parser';
import { PaginatedResponseDto } from 'src/common/dto/paginated-response.dto';
import { RoleResponseDto } from '../dto/response.dto';

export class RoleMapper {
  static toResponse(entity: Role): RoleResponseDto {
    return {
      id: entity.id,
      name: entity.name,
      active: entity.active,
      permissions: entity.permissions
        ? PermissionMapper.toResponseList(entity.permissions)
        : undefined,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt,
    };
  }

  static toResponseList(entities: Role[]): RoleResponseDto[] {
    return entities.map((e) => this.toResponse(e));
  }

  static toPaginatedResponse(
    pagination: PaginationParser<Role>,
  ): PaginatedResponseDto<RoleResponseDto> {
    return new PaginatedResponseDto(
      this.toResponseList(pagination.data),
      pagination.pagination,
    );
  }
}
