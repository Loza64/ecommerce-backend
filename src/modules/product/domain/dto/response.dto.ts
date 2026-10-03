import { BaseResponse } from 'src/common/dto/base-response.dto';
import { UploadResponseDto } from 'src/modules/upload/domain/dto/response.dto';
import { VariantAttributes } from '../entity/product-variant.entity';

export class ProductVariantResponseDto extends BaseResponse {
  sku!: string;
  price!: number;
  stockQuantity!: number;
  attributes!: VariantAttributes;
}

export class ProductResponseDto extends BaseResponse {
  name!: string;
  description!: string;
  category!: {
    id: number;
    name: string;
    parent: { id: number; name: string } | null;
  } | null;
  seller!: { id: number; username: string; name: string } | null;
  images!: UploadResponseDto[];
  variants!: ProductVariantResponseDto[];
}
