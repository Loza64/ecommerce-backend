import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { FindOptionsWhere, In, IsNull, Not } from 'typeorm';
import { Profile } from 'src/common/decorators/profile';
import { Public } from 'src/common/decorators/public';
import { parseSearch, parseSort } from 'src/common/helpers/entities.parse';
import { CategoryService } from 'src/modules/category/service/category.service';
import { User } from 'src/modules/user/domain/entity/user.entity';
import {
  PRODUCT_FULL_RELATIONS,
  ProductService,
} from '../service/product.service';
import { Product } from '../domain/entity/product.entity';
import { ProductMapper } from '../domain/mappers/product.mapper';
import {
  ProductResponseDto,
  ProductVariantResponseDto,
} from '../domain/dto/response.dto';
import { ProductQuerys } from '../domain/dto/querys';
import {
  CreateProductDto,
  CreateVariantDto,
  UpdateProductDto,
  UpdateVariantDto,
} from '../domain/dto/payload.dto';

const FORBIDDEN_SORT: (keyof Product)[] = [
  'category',
  'seller',
  'images',
  'variants',
];

@Controller('products')
export class ProductController {
  constructor(
    private readonly productService: ProductService,
    private readonly categoryService: CategoryService,
  ) {}

  private async listProducts(
    query: ProductQuerys,
    extraFilter: FindOptionsWhere<Product>,
    includeDeleted: boolean,
  ) {
    const { page, pageSize: size, search, sort, category, seller } = query;

    const baseFilter: FindOptionsWhere<Product> = {
      ...extraFilter,
      deletedAt: includeDeleted ? Not(IsNull()) : IsNull(),
    };
    if (seller) baseFilter.seller = { id: seller };
    if (category) {
      const ids = await this.categoryService.findWithDescendantIds(category);
      baseFilter.category = { id: In(ids) };
    }

    const filters = parseSearch<Product>(
      search,
      ['name', 'description'],
      baseFilter,
    );
    const order = parseSort<Product>({
      sort,
      forbiddenFields: FORBIDDEN_SORT,
      defaultSort: { id: 'DESC' },
    });

    const result = await this.productService.findBy({
      withDeleted: includeDeleted,
      filters,
      order,
      relations: PRODUCT_FULL_RELATIONS,
      page,
      size,
    });
    return ProductMapper.toPaginatedResponse(result);
  }

  /** Catálogo público (nunca incluye productos eliminados) */
  @Get()
  @Public()
  @HttpCode(HttpStatus.OK)
  findAll(@Query() query: ProductQuerys) {
    return this.listProducts(query, {}, false);
  }

  /** Mis productos (como vendedor) */
  @Get('mine')
  @HttpCode(HttpStatus.OK)
  findMine(@Query() query: ProductQuerys, @Profile() profile: User) {
    return this.listProducts(
      { ...query, seller: undefined },
      { seller: { id: profile.id } },
      !!query.deleted,
    );
  }

  @Get(':id')
  @Public()
  @HttpCode(HttpStatus.OK)
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ProductResponseDto> {
    const product = await this.productService.findOneBy({
      filters: { id },
      relations: PRODUCT_FULL_RELATIONS,
    });
    return ProductMapper.toResponse(product);
  }

  @Post()
  async create(
    @Body() dto: CreateProductDto,
    @Profile() profile: User,
  ): Promise<ProductResponseDto> {
    const product = await this.productService.create(dto, profile);
    return ProductMapper.toResponse(product);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateProductDto,
    @Profile() profile: User,
  ): Promise<ProductResponseDto> {
    const product = await this.productService.update({ id, data }, profile);
    return ProductMapper.toResponse(product);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async softDelete(
    @Param('id', ParseIntPipe) id: number,
    @Profile() profile: User,
  ): Promise<ProductResponseDto> {
    const product = await this.productService.softDelete(id, profile);
    return ProductMapper.toResponse(product);
  }

  @Patch(':id/restore')
  @HttpCode(HttpStatus.OK)
  async restore(
    @Param('id', ParseIntPipe) id: number,
    @Profile() profile: User,
  ): Promise<ProductResponseDto> {
    const product = await this.productService.softRestore(id, profile);
    return ProductMapper.toResponse(product);
  }

  /* ------------------------------- variantes ------------------------------ */

  @Post(':id/variants')
  async addVariant(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateVariantDto,
    @Profile() profile: User,
  ): Promise<ProductVariantResponseDto> {
    const variant = await this.productService.addVariant(id, dto, profile);
    return ProductMapper.variantToResponse(variant);
  }

  @Put(':id/variants/:variantId')
  @HttpCode(HttpStatus.OK)
  async updateVariant(
    @Param('id', ParseIntPipe) id: number,
    @Param('variantId', ParseIntPipe) variantId: number,
    @Body() dto: UpdateVariantDto,
    @Profile() profile: User,
  ): Promise<ProductVariantResponseDto> {
    const variant = await this.productService.updateVariant(
      id,
      variantId,
      dto,
      profile,
    );
    return ProductMapper.variantToResponse(variant);
  }

  @Delete(':id/variants/:variantId')
  @HttpCode(HttpStatus.OK)
  async removeVariant(
    @Param('id', ParseIntPipe) id: number,
    @Param('variantId', ParseIntPipe) variantId: number,
    @Profile() profile: User,
  ): Promise<ProductVariantResponseDto> {
    const variant = await this.productService.removeVariant(
      id,
      variantId,
      profile,
    );
    return ProductMapper.variantToResponse(variant);
  }
}
