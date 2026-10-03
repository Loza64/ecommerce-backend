import { Module } from '@nestjs/common';
import { CloudinaryService } from './cloudinary.service';
import { CloudinaryModule as Cloudinary } from '@scwar/nestjs-cloudinary';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ResilienceModule } from 'src/shared/resilience/resilience.module';

@Module({
  imports: [
    ConfigModule,
    ResilienceModule,
    Cloudinary.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        cloud_name: config.get<string>('CLOUDINARY_CLOUD_NAME'),
        api_key: config.get<string>('CLOUDINARY_API_KEY'),
        api_secret: config.get<string>('CLOUDINARY_API_SECRET'),
        secure: true,
      }),
    }),
  ],
  providers: [CloudinaryService],
  exports: [CloudinaryService],
})
export class CloudinaryModule {}
