import { PaginationParser } from 'src/common/parser/pagination.parser';
import { PaginatedResponseDto } from 'src/common/dto/paginated-response.dto';
import { UploadMapper } from 'src/modules/upload/domain/mappers/upload.mapper';
import { Product } from '../entity/product.entity';
import { ProductVariant } from '../entity/product-variant.entity';
import {
  ProductResponseDto,
  ProductVariantResponseDto,
} from '../dto/response.dto';

export class ProductMapper {
  static variantToResponse(entity: ProductVariant): ProductVariantResponseDto {
    return {
      id: entity.id,
      sku: entity.sku,
      price: entity.price,
      stockQuantity: entity.stockQuantity,
      attributes: entity.attributes,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt,
    };
  }

  static toResponse(entity: Product): ProductResponseDto {
    const images = [...(entity.images ?? [])]
      .filter((image) => image.upload)
      .sort((a, b) => a.position - b.position)
      .map((image) => UploadMapper.toResponse(image.upload));

    return {
      id: entity.id,
      name: entity.name,
      description: entity.description,
      category: entity.category
        ? {
            id: entity.category.id,
            name: entity.category.name,
            parent: entity.category.parent
              ? {
                  id: entity.category.parent.id,
                  name: entity.category.parent.name,
                }
              : null,
          }
        : null,
      seller: entity.seller
        ? {
            id: entity.seller.id,
            username: entity.seller.username,
            name: entity.seller.name,
          }
        : null,
      images,
      variants: [...(entity.variants ?? [])]
        .sort((a, b) => a.id - b.id)
        .map((v) => this.variantToResponse(v)),
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt,
    };
  }

  static toResponseList(entities: Product[]): ProductResponseDto[] {
    return entities.map((e) => this.toResponse(e));
  }

  static toPaginatedResponse(
    pagination: PaginationParser<Product>,
  ): PaginatedResponseDto<ProductResponseDto> {
    return new PaginatedResponseDto(
      this.toResponseList(pagination.data),
      pagination.pagination,
    );
  }
}
