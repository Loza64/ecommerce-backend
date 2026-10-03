import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Coupon } from './domain/entity/coupon.entity';
import { CouponService } from './service/coupon.service';
import { CouponController } from './controller/coupon.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Coupon])],
  providers: [CouponService],
  controllers: [CouponController],
  exports: [CouponService],
})
export class CouponModule {}
