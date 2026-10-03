import { BaseResponse } from 'src/common/dto/base-response.dto';

export class CategoryResponseDto extends BaseResponse {
  name!: string;
  description!: string | null;
  parent!: { id: number; name: string } | null;
  children?: { id: number; name: string; description: string | null }[];
}
