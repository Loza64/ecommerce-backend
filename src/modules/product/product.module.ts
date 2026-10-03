import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoryModule } from '../category/category.module';
import { UploadModule } from '../upload/upload.module';
import { CartItem } from '../cart/domain/entity/cart-item.entity';
import { Product } from './domain/entity/product.entity';
import { ProductVariant } from './domain/entity/product-variant.entity';
import { ProductImage } from './domain/entity/product-image.entity';
import { ProductService } from './service/product.service';
import { ProductController } from './controller/product.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, ProductVariant, ProductImage, CartItem]),
    CategoryModule,
    UploadModule,
  ],
  providers: [ProductService],
  controllers: [ProductController],
  exports: [ProductService],
})
export class ProductModule {}
