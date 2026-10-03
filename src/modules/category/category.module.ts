import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from './domain/entity/category.entity';
import { Product } from '../product/domain/entity/product.entity';
import { CategoryService } from './service/category.service';
import { CategoryController } from './controller/category.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Category, Product])],
  providers: [CategoryService],
  controllers: [CategoryController],
  exports: [CategoryService],
})
export class CategoryModule {}
