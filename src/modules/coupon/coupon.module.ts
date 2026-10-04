import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from '../order/domain/entity/order.entity';
import { Coupon } from './domain/entity/coupon.entity';
import { CouponService } from './service/coupon.service';
import { CouponController } from './controller/coupon.controller';
import { UserModule } from '../user/user.module';

@Module({
  imports: [TypeOrmModule.forFeature([Coupon, Order]), UserModule],
  providers: [CouponService],
  controllers: [CouponController],
  exports: [CouponService],
})
export class CouponModule {}
