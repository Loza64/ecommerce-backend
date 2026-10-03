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
import { FindOptionsWhere, IsNull } from 'typeorm';
import { Public } from 'src/common/decorators/public';
import { PreAuthorized } from 'src/common/decorators/pre-authorized';
import { PERMISSIONS } from 'src/common/constants/permissions';
import { parseSearch, parseSort } from 'src/common/helpers/entities.parse';
import { CategoryService } from '../service/category.service';
import { Category } from '../domain/entity/category.entity';
import { CategoryMapper } from '../domain/mappers/category.mapper';
import { CategoryResponseDto } from '../domain/dto/response.dto';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
} from '../domain/dto/payload.dto';
import { CategoryQuerys } from '../domain/dto/querys';

@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  @Public()
  @HttpCode(HttpStatus.OK)
  async findAll(@Query() query: CategoryQuerys) {
    const { page, pageSize: size, search, sort, parent, root } = query;

    const baseFilter: FindOptionsWhere<Category> = { deletedAt: IsNull() };
    if (parent) baseFilter.parent = { id: parent };
    else if (root) baseFilter.parent = IsNull();

    const filters = parseSearch<Category>(search, ['name'], baseFilter);
    const order = parseSort<Category>({
      sort,
      forbiddenFields: ['parent', 'children'],
      defaultSort: { name: 'ASC' },
    });

    const result = await this.categoryService.findBy({
      filters,
      order,
      relations: { parent: true },
      page,
      size,
    });
    return CategoryMapper.toPaginatedResponse(result);
  }

  /** Árbol completo: categorías raíz con sus subcategorías */
  @Get('tree')
  @Public()
  @HttpCode(HttpStatus.OK)
  async tree(): Promise<CategoryResponseDto[]> {
    const roots = await this.categoryService.findTree();
    return CategoryMapper.toResponseList(roots);
  }

  @Get(':id')
  @Public()
  @HttpCode(HttpStatus.OK)
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<CategoryResponseDto> {
    const category = await this.categoryService.findOneBy({
      filters: { id },
      relations: { parent: true, children: true },
    });
    return CategoryMapper.toResponse(category);
  }

  @Post()
  @PreAuthorized(PERMISSIONS.CREATE_CATEGORY)
  async create(@Body() dto: CreateCategoryDto): Promise<CategoryResponseDto> {
    const category = await this.categoryService.create(dto);
    return CategoryMapper.toResponse(category);
  }

  @Put(':id')
  @PreAuthorized(PERMISSIONS.UPDATE_CATEGORY)
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateCategoryDto,
  ): Promise<CategoryResponseDto> {
    const category = await this.categoryService.update({ id, data });
    return CategoryMapper.toResponse(category);
  }

  @Delete(':id')
  @PreAuthorized(PERMISSIONS.DELETE_CATEGORY)
  @HttpCode(HttpStatus.OK)
  async softDelete(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<CategoryResponseDto> {
    const category = await this.categoryService.softDelete(id);
    return CategoryMapper.toResponse(category);
  }

  @Patch(':id/restore')
  @PreAuthorized(PERMISSIONS.RESTORE_CATEGORY)
  @HttpCode(HttpStatus.OK)
  async restore(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<CategoryResponseDto> {
    const category = await this.categoryService.softRestore(id);
    return CategoryMapper.toResponse(category);
  }
}
