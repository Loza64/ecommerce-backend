import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { allowedMimeTypes } from 'src/common/constants/mime-types';

@Injectable()
export class UploadInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const file = request.file;
    const files = request.files as Express.Multer.File[] | undefined;

    if (!file && (!files || files.length === 0))
      throw new BadRequestException('No file uploaded');

    if (file) {
      if (!allowedMimeTypes.includes(file.mimetype)) {
        throw new BadRequestException(
          'Invalid file type. Only images, videos and PDF files are allowed.',
        );
      }
    }

    if (files && files.length > 0) {
      for (const f of files) {
        if (!allowedMimeTypes.includes(f.mimetype)) {
          throw new BadRequestException(`Invalid file type: ${f.originalname}`);
        }
      }
    }

    return next.handle();
  }
}
