import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { paginate } from 'nestjs-typeorm-paginate';
import {
  DataSource,
  EntityManager,
  FindOptionsOrder,
  FindOptionsRelations,
  FindOptionsWhere,
  In,
  Repository,
} from 'typeorm';
import { PERMISSIONS } from 'src/common/constants/permissions';
import { PaginationParser } from 'src/common/parser/pagination.parser';
import { CategoryService } from 'src/modules/category/service/category.service';
import { CartItem } from 'src/modules/cart/domain/entity/cart-item.entity';
import { UploadService } from 'src/modules/upload/service/upload.service';
import { User } from 'src/modules/user/domain/entity/user.entity';
import { Product } from '../domain/entity/product.entity';
import { ProductVariant } from '../domain/entity/product-variant.entity';
import { ProductImage } from '../domain/entity/product-image.entity';
import {
  CreateProductDto,
  CreateVariantDto,
  UpdateProductDto,
  UpdateVariantDto,
} from '../domain/dto/payload.dto';

export const PRODUCT_FULL_RELATIONS: FindOptionsRelations<Product> = {
  category: { parent: true },
  seller: true,
  images: { upload: true },
  variants: true,
};

@Injectable()
export class ProductService {
  private readonly logger = new Logger(ProductService.name);

  constructor(
    @InjectRepository(Product) private readonly repo: Repository<Product>,
    @InjectRepository(ProductVariant)
    private readonly variantRepo: Repository<ProductVariant>,
    @InjectRepository(ProductImage)
    private readonly imageRepo: Repository<ProductImage>,
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly categoryService: CategoryService,
    private readonly uploadService: UploadService,
  ) {}

  /* ------------------------------ permisos ------------------------------ */

  private canModerate(user: User): boolean {
    return (
      user.role?.name === 'SUPER_ADMIN' ||
      !!user.role?.permissions?.some(
        (p) => p.name === PERMISSIONS.MANAGE_PRODUCTS,
      )
    );
  }

  /** Solo el vendedor (o un moderador) puede modificar el producto */
  private assertCanManage(product: Product, user: User): void {
    if (product.seller.id !== user.id && !this.canModerate(user))
      throw new ForbiddenException('Este producto no te pertenece');
  }

  /* ----------------------------- validaciones ---------------------------- */

  private assertUniqueSkusInPayload(skus: string[]): void {
    if (new Set(skus).size !== skus.length)
      throw new BadRequestException('Hay SKUs repetidos en las variantes');
  }

  private async assertSkusAvailable(
    skus: string[],
    ignoreVariantId?: number,
  ): Promise<void> {
    const taken = await this.variantRepo.find({
      where: { sku: In(skus) },
      select: { id: true, sku: true },
    });
    const conflict = taken.find((v) => v.id !== ignoreVariantId);
    if (conflict)
      throw new ConflictException(`El SKU "${conflict.sku}" ya está en uso`);
  }

  private async assertImagesAvailable(
    uploadIds: number[],
    productId?: number,
  ): Promise<void> {
    if (!uploadIds.length) return;

    const uploads = await this.uploadService.findByIds(uploadIds);
    if (uploads.length !== uploadIds.length)
      throw new NotFoundException('Alguna de las imágenes no existe');
    if (uploads.some((u) => u.resourceType !== 'image'))
      throw new BadRequestException('Todos los archivos deben ser imágenes');

    const used = await this.imageRepo.find({
      where: { upload: { id: In(uploadIds) } },
      relations: { product: true },
    });
    if (used.some((image) => image.product.id !== productId))
      throw new ConflictException(
        'Alguna de las imágenes ya está asignada a otro producto',
      );
  }

  private async deleteUploads(ids: number[]): Promise<void> {
    const results = await Promise.allSettled(
      ids.map((id) => this.uploadService.deleteFile(id)),
    );
    results.forEach((result, i) => {
      if (result.status === 'rejected')
        this.logger.error(
          `No se pudo eliminar la imagen ${ids[i]}: ${String(result.reason)}`,
        );
    });
  }

  /** Quita del carrito (activos) los items cuyas variantes dejan de existir */
  private async removeFromActiveCarts(
    manager: EntityManager,
    where: { productId: number } | { variantId: number },
  ): Promise<void> {
    const qb = manager
      .createQueryBuilder()
      .delete()
      .from(CartItem)
      .where("cart_id IN (SELECT id FROM carts WHERE status = 'active')");

    if ('productId' in where)
      qb.andWhere(
        'product_variant_id IN (SELECT id FROM product_variants WHERE product_id = :productId)',
        { productId: where.productId },
      );
    else
      qb.andWhere('product_variant_id = :variantId', {
        variantId: where.variantId,
      });

    await qb.execute();
  }

  /* -------------------------------- CRUD --------------------------------- */

  async create(data: CreateProductDto, seller: User): Promise<Product> {
    await this.categoryService.findOneBy({ filters: { id: data.category.id } });

    const skus = data.variants.map((v) => v.sku);
    this.assertUniqueSkusInPayload(skus);
    await this.assertSkusAvailable(skus);

    const imageIds = data.images.map((i) => i.id);
    await this.assertImagesAvailable(imageIds);

    const productId = await this.dataSource.transaction(async (manager) => {
      const product = await manager.save(
        Product,
        manager.create(Product, {
          name: data.name,
          description: data.description,
          category: { id: data.category.id },
          seller: { id: seller.id },
        }),
      );

      await manager.save(
        ProductImage,
        imageIds.map((uploadId, position) =>
          manager.create(ProductImage, {
            product: { id: product.id },
            upload: { id: uploadId },
            position,
          }),
        ),
      );

      await manager.save(
        ProductVariant,
        data.variants.map((variant) =>
          manager.create(ProductVariant, {
            ...variant,
            attributes: variant.attributes ?? {},
            product: { id: product.id },
          }),
        ),
      );

      return product.id;
    });

    return this.findOneBy({
      filters: { id: productId },
      relations: PRODUCT_FULL_RELATIONS,
    });
  }

  async update(
    { id, data }: { id: number; data: UpdateProductDto },
    user: User,
  ): Promise<Product> {
    const product = await this.findOneBy({
      filters: { id },
      relations: { seller: true, images: { upload: true } },
    });
    this.assertCanManage(product, user);

    const { category, images, ...rest } = data;

    if (category)
      await this.categoryService.findOneBy({ filters: { id: category.id } });

    const newImageIds = images?.map((i) => i.id);
    if (newImageIds) await this.assertImagesAvailable(newImageIds, id);

    const oldImageIds = product.images.map((i) => i.upload.id);

    await this.dataSource.transaction(async (manager) => {
      Object.assign(product, rest);
      if (category)
        product.category = { id: category.id } as Product['category'];
      await manager.save(Product, product);

      if (newImageIds) {
        await manager
          .createQueryBuilder()
          .delete()
          .from(ProductImage)
          .where('product_id = :id', { id })
          .execute();

        await manager.save(
          ProductImage,
          newImageIds.map((uploadId, position) =>
            manager.create(ProductImage, {
              product: { id },
              upload: { id: uploadId },
              position,
            }),
          ),
        );
      }
    });

    if (newImageIds) {
      const removed = oldImageIds.filter((x) => !newImageIds.includes(x));
      await this.deleteUploads(removed);
    }

    return this.findOneBy({
      filters: { id },
      relations: PRODUCT_FULL_RELATIONS,
    });
  }

  async softDelete(id: number, user: User): Promise<Product> {
    const product = await this.findOneBy({
      filters: { id },
      relations: { seller: true },
    });
    this.assertCanManage(product, user);

    await this.dataSource.transaction(async (manager) => {
      await manager.softDelete(Product, id);
      await this.removeFromActiveCarts(manager, { productId: id });
    });

    return this.repo.findOneOrFail({
      where: { id },
      withDeleted: true,
      relations: PRODUCT_FULL_RELATIONS,
    });
  }

  async softRestore(id: number, user: User): Promise<Product> {
    const product = await this.repo.findOne({
      where: { id },
      withDeleted: true,
      relations: { seller: true },
    });
    if (!product) throw new NotFoundException(`Producto ${id} no existe`);
    this.assertCanManage(product, user);

    await this.repo.restore(id);
    return this.findOneBy({
      filters: { id },
      relations: PRODUCT_FULL_RELATIONS,
    });
  }

  /* ------------------------------- variantes ------------------------------ */

  async addVariant(
    productId: number,
    data: CreateVariantDto,
    user: User,
  ): Promise<ProductVariant> {
    const product = await this.findOneBy({
      filters: { id: productId },
      relations: { seller: true },
    });
    this.assertCanManage(product, user);
    await this.assertSkusAvailable([data.sku]);

    return this.variantRepo.save(
      this.variantRepo.create({
        ...data,
        attributes: data.attributes ?? {},
        product: { id: productId },
      }),
    );
  }

  async updateVariant(
    productId: number,
    variantId: number,
    data: UpdateVariantDto,
    user: User,
  ): Promise<ProductVariant> {
    const product = await this.findOneBy({
      filters: { id: productId },
      relations: { seller: true },
    });
    this.assertCanManage(product, user);

    const variant = await this.variantRepo.findOne({
      where: { id: variantId, product: { id: productId } },
    });
    if (!variant) throw new NotFoundException('Variante no encontrada');

    if (data.sku && data.sku !== variant.sku)
      await this.assertSkusAvailable([data.sku], variant.id);

    Object.assign(variant, data);
    return this.variantRepo.save(variant);
  }

  async removeVariant(
    productId: number,
    variantId: number,
    user: User,
  ): Promise<ProductVariant> {
    const product = await this.findOneBy({
      filters: { id: productId },
      relations: { seller: true },
    });
    this.assertCanManage(product, user);

    const variant = await this.variantRepo.findOne({
      where: { id: variantId, product: { id: productId } },
    });
    if (!variant) throw new NotFoundException('Variante no encontrada');

    const total = await this.variantRepo.count({
      where: { product: { id: productId } },
    });
    if (total <= 1)
      throw new ConflictException(
        'El producto debe tener al menos una variante',
      );

    await this.dataSource.transaction(async (manager) => {
      await manager.softDelete(ProductVariant, variantId);
      await this.removeFromActiveCarts(manager, { variantId });
    });
    return variant;
  }

  /* ------------------------------- consultas ------------------------------ */

  async findOneBy(params: {
    filters: FindOptionsWhere<Product> | FindOptionsWhere<Product>[];
    relations?: FindOptionsRelations<Product>;
  }): Promise<Product> {
    const product = await this.repo.findOne({
      where: params.filters,
      relations: params.relations,
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async findBy(params: {
    order?: FindOptionsOrder<Product>;
    filters: FindOptionsWhere<Product> | FindOptionsWhere<Product>[];
    relations?: FindOptionsRelations<Product>;
    page: number;
    size: number;
    withDeleted?: boolean;
  }): Promise<PaginationParser<Product>> {
    const result = await paginate<Product>(
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
    filters?: FindOptionsWhere<Product> | FindOptionsWhere<Product>[],
  ): Promise<number> {
    return this.repo.count({ where: filters });
  }
}
