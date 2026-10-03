import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CouponModule } from '../coupon/coupon.module';
import { ProductVariant } from '../product/domain/entity/product-variant.entity';
import { Cart } from './domain/entity/cart.entity';
import { CartItem } from './domain/entity/cart-item.entity';
import { CartCoupon } from './domain/entity/cart-coupon.entity';
import { CartService } from './service/cart.service';
import { CartController } from './controller/cart.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Cart, CartItem, CartCoupon, ProductVariant]),
    CouponModule,
  ],
  providers: [CartService],
  controllers: [CartController],
  exports: [CartService],
})
export class CartModule {}
