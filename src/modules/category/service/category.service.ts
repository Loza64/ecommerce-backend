import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { paginate } from 'nestjs-typeorm-paginate';
import {
  FindOptionsOrder,
  FindOptionsRelations,
  FindOptionsWhere,
  IsNull,
  Repository,
} from 'typeorm';
import { ICrudService } from 'src/common/service/crud.service';
import { PaginationParser } from 'src/common/parser/pagination.parser';
import { Product } from 'src/modules/product/domain/entity/product.entity';
import { Category } from '../domain/entity/category.entity';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
} from '../domain/dto/payload.dto';

@Injectable()
export class CategoryService implements ICrudService<
  Category,
  CreateCategoryDto,
  UpdateCategoryDto
> {
  constructor(
    @InjectRepository(Category) private readonly repo: Repository<Category>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  /**
   * Solo se permiten 2 niveles: categoría -> subcategoría.
   * Devuelve el padre validado (o null si es raíz).
   */
  private async resolveParent(
    parentId: number | undefined,
    selfId?: number,
  ): Promise<Category | null> {
    if (!parentId) return null;
    if (selfId && parentId === selfId)
      throw new BadRequestException(
        'Una categoría no puede ser su propio padre',
      );

    const parent = await this.repo.findOne({
      where: { id: parentId },
      relations: { parent: true },
    });
    if (!parent) throw new NotFoundException(`Categoría ${parentId} no existe`);
    if (parent.parent)
      throw new BadRequestException(
        'Solo se permiten categorías y subcategorías (2 niveles)',
      );

    if (selfId) {
      const childrenCount = await this.repo.count({
        where: { parent: { id: selfId } },
      });
      if (childrenCount > 0)
        throw new BadRequestException(
          'Una categoría con subcategorías no puede convertirse en subcategoría',
        );
    }
    return parent;
  }

  private async assertUniqueName(
    name: string,
    parentId: number | null,
    selfId?: number,
  ): Promise<void> {
    const existing = await this.repo.findOne({
      where: { name, parent: parentId ? { id: parentId } : IsNull() },
    });
    if (existing && existing.id !== selfId)
      throw new ConflictException(
        'Ya existe una categoría con ese nombre en el mismo nivel',
      );
  }

  async create(data: CreateCategoryDto): Promise<Category> {
    const parent = await this.resolveParent(data.parent?.id);
    await this.assertUniqueName(data.name, parent?.id ?? null);
    const category = this.repo.create({
      name: data.name,
      description: data.description ?? null,
      parent,
    });
    return this.repo.save(category);
  }

  async update({
    id,
    data,
  }: {
    id: number;
    data: UpdateCategoryDto;
  }): Promise<Category> {
    const category = await this.findOneBy({
      filters: { id },
      relations: { parent: true },
    });
    const { parent: parentDto, ...rest } = data;

    if (parentDto !== undefined)
      category.parent = await this.resolveParent(parentDto.id, id);

    Object.assign(category, rest);
    await this.assertUniqueName(
      category.name,
      category.parent?.id ?? null,
      category.id,
    );
    return this.repo.save(category);
  }

  async delete(id: number): Promise<Category> {
    const category = await this.findOneBy({ filters: { id } });
    await this.repo.remove(category);
    return category;
  }

  async softDelete(id: number): Promise<Category> {
    await this.findOneBy({ filters: { id } });

    const [children, products] = await Promise.all([
      this.repo.count({ where: { parent: { id } } }),
      this.productRepo.count({ where: { category: { id } } }),
    ]);
    if (children > 0)
      throw new ConflictException(
        'No se puede eliminar una categoría que tiene subcategorías',
      );
    if (products > 0)
      throw new ConflictException(
        'No se puede eliminar una categoría que tiene productos',
      );

    await this.repo.softDelete(id);
    return this.repo.findOneOrFail({ where: { id }, withDeleted: true });
  }

  async softRestore(id: number): Promise<Category> {
    const result = await this.repo.restore(id);
    if (!result.affected)
      throw new NotFoundException(`Categoría ${id} no existe`);
    return this.repo.findOneByOrFail({ id });
  }

  /** ids de la categoría + sus subcategorías (para filtrar productos) */
  async findWithDescendantIds(id: number): Promise<number[]> {
    const children = await this.repo.find({
      where: { parent: { id } },
      select: { id: true },
    });
    return [id, ...children.map((c) => c.id)];
  }

  async findTree(): Promise<Category[]> {
    return this.repo.find({
      where: { parent: IsNull() },
      relations: { children: true },
      order: { name: 'ASC', children: { name: 'ASC' } },
    });
  }

  async findOneBy(params: {
    filters: FindOptionsWhere<Category> | FindOptionsWhere<Category>[];
    relations?: FindOptionsRelations<Category>;
  }): Promise<Category> {
    const category = await this.repo.findOne({
      where: params.filters,
      relations: params.relations,
    });
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  async findBy(params: {
    order?: FindOptionsOrder<Category>;
    filters: FindOptionsWhere<Category> | FindOptionsWhere<Category>[];
    relations?: FindOptionsRelations<Category>;
    page: number;
    size: number;
    withDeleted?: boolean;
  }): Promise<PaginationParser<Category>> {
    const result = await paginate<Category>(
      this.repo,
      { page: params.page, limit: params.size },
      {
        where: params.filters,
        relations: params.relations,
        order: params.order,
        withDeleted: params.withDeleted,
      },
    );
    return new PaginationParser(result);
  }

  async count(
    filters?: FindOptionsWhere<Category> | FindOptionsWhere<Category>[],
  ): Promise<number> {
    return this.repo.count({ where: filters });
  }
}
