import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { Upload } from './domain/entity/upload.entity';
import { CloudinaryModule } from 'src/integrations/cloudinary/cloudinary.module';
import { UploadInterceptorModule } from 'src/common/interceptors/upload/upload.interceptor.module';
import { SchedulerModule } from 'src/shared/scheduler/scheduler.module';
import { UploadService } from './service/upload.service';
import { UploadController } from './controller/upload.controller';
import { OrphanUploadsCleanupJob } from './jobs/orphan-uploads-cleanup.job';

@Module({
  imports: [
    ConfigModule,
    CloudinaryModule,
    UploadInterceptorModule,
    SchedulerModule,
    TypeOrmModule.forFeature([Upload]),
  ],
  providers: [UploadService, OrphanUploadsCleanupJob],
  controllers: [UploadController],
  exports: [UploadService],
})
export class UploadModule {}
