import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CloudinaryModule } from './integrations/cloudinary/cloudinary.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { RoleModule } from './modules/role/role.module';
import { PermissionModule } from './modules/permission/permission.module';
import { UploadModule } from './modules/upload/upload.module';
import { UploadInterceptorModule } from './common/interceptors/upload/upload.interceptor.module';
import { HealthModule } from './modules/health/health.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './security/jwt/jwt.guard';
import { PermissionsGuard } from './security/permission/permissions.guard';
import { CryptoModule } from './integrations/crypto/crypto.module';
import { TypeormModule } from './integrations/typeorm/typeorm.module';
import { JsonwebtokenModule } from './integrations/jsonwebtoken/jsonwebtoken.module';
import { RefreshTokenModule } from './modules/refresh_token/refresh_token.module';
import { ResilienceModule } from './shared/resilience/resilience.module';
import { SchedulerModule } from './shared/scheduler/scheduler.module';
import { RedisModule } from './integrations/redis/redis.module';
import { IdempotencyModule } from './shared/idempotency/idempotency.module';
import { CategoryModule } from './modules/category/category.module';
import { ProductModule } from './modules/product/product.module';
import { CouponModule } from './modules/coupon/coupon.module';
import { CartModule } from './modules/cart/cart.module';
import { OrderModule } from './modules/order/order.module';
import { PaymentModule } from './modules/payment/payment.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ResilienceModule,
    SchedulerModule,
    RedisModule,
    IdempotencyModule,
    JsonwebtokenModule,
    TypeormModule,
    CryptoModule,
    CloudinaryModule,
    AuthModule,
    UserModule,
    RoleModule,
    PermissionModule,
    UploadModule,
    UploadInterceptorModule,
    RefreshTokenModule,
    HealthModule,
    CategoryModule,
    ProductModule,
    CouponModule,
    CartModule,
    OrderModule,
    PaymentModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
  ],
})
export class AppModule {}
