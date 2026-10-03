import { Module } from '@nestjs/common';
import { UploadInterceptor } from './upload.interceptor';

//nest g module common/interceptors/upload/upload.interceptor --flat
@Module({
  providers: [UploadInterceptor],
  exports: [UploadInterceptor],
})
export class UploadInterceptorModule {}
