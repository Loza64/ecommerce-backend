import { User } from '../entity/user.entity';
import { RoleMapper } from 'src/modules/role/domain/mappers/role.mapper';
import { UploadMapper } from 'src/modules/upload/domain/mappers/upload.mapper';
import { PaginationParser } from 'src/common/parser/pagination.parser';
import { PaginatedResponseDto } from 'src/common/dto/paginated-response.dto';
import { UserResponseDto } from '../dto/response.dto';

export class UserMapper {
  static toResponse(entity: User): UserResponseDto {
    return {
      id: entity.id,
      username: entity.username,
      name: entity.name,
      surname: entity.surname,
      email: entity.email,
      blocked: entity.blocked,
      role: entity.role ? RoleMapper.toResponse(entity.role) : null,
      photo: entity.photo ? UploadMapper.toResponse(entity.photo) : null,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt,
    };
  }

  static toResponseList(entities: User[]): UserResponseDto[] {
    return entities.map((e) => this.toResponse(e));
  }

  static toPaginatedResponse(
    pagination: PaginationParser<User>,
  ): PaginatedResponseDto<UserResponseDto> {
    return new PaginatedResponseDto(
      this.toResponseList(pagination.data),
      pagination.pagination,
    );
  }
}
