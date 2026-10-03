import { PaginationParser } from 'src/common/parser/pagination.parser';
import { PaginatedResponseDto } from 'src/common/dto/paginated-response.dto';
import { Category } from '../entity/category.entity';
import { CategoryResponseDto } from '../dto/response.dto';

export class CategoryMapper {
  static toResponse(entity: Category): CategoryResponseDto {
    return {
      id: entity.id,
      name: entity.name,
      description: entity.description,
      parent: entity.parent
        ? { id: entity.parent.id, name: entity.parent.name }
        : null,
      ...(entity.children && {
        children: entity.children.map((c) => ({
          id: c.id,
          name: c.name,
          description: c.description,
        })),
      }),
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt,
    };
  }

  static toResponseList(entities: Category[]): CategoryResponseDto[] {
    return entities.map((e) => this.toResponse(e));
  }

  static toPaginatedResponse(
    pagination: PaginationParser<Category>,
  ): PaginatedResponseDto<CategoryResponseDto> {
    return new PaginatedResponseDto(
      this.toResponseList(pagination.data),
      pagination.pagination,
    );
  }
}
