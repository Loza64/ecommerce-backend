import { Type } from 'class-transformer';
import { IsDefined, IsInt, Max, Min, ValidateNested } from 'class-validator';
import IdDto from 'src/common/dto/id.dto';

export const MAX_ITEM_QUANTITY = 99;

export class AddCartItemDto {
  /** { id: number } */
  @IsDefined()
  @ValidateNested()
  @Type(() => IdDto)
  productVariant!: IdDto;

  @IsInt() @Min(1) @Max(MAX_ITEM_QUANTITY) quantity!: number;
}

export class UpdateCartItemDto {
  @IsInt() @Min(1) @Max(MAX_ITEM_QUANTITY) quantity!: number;
}
