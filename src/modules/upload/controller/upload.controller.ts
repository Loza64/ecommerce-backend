import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Get,
  Query,
  Param,
  Delete,
  UploadedFiles,
  Body,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { UploadService } from '../service/upload.service';
import { UploadInterceptor } from 'src/common/interceptors/upload/upload.interceptor';
import { CreateUploadDto } from '../domain/dto/create.dto';
import { UploadMapper } from '../domain/mappers/upload.mapper';
import { UploadResponseDto } from '../domain/dto/response.dto';
import { PreAuthorized } from 'src/common/decorators/pre-authorized';
import { PERMISSIONS } from 'src/common/constants/permissions';

@Controller('uploads')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post()
  @PreAuthorized(PERMISSIONS.CREATE_UPLOAD)
  @UseInterceptors(
    FileInterceptor('file', { storage: memoryStorage() }),
    UploadInterceptor,
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: CreateUploadDto,
  ): Promise<UploadResponseDto> {
    const upload = await this.uploadService.uploadFile(file, body.tags);
    return UploadMapper.toResponse(upload);
  }

  @Post('/many')
  @PreAuthorized(PERMISSIONS.CREATE_UPLOAD)
  @UseInterceptors(
    FilesInterceptor('files', 10, { storage: memoryStorage() }),
    UploadInterceptor,
  )
  async uploadManyFile(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: CreateUploadDto,
  ): Promise<UploadResponseDto[]> {
    const uploads = await this.uploadService.uploadManyFiles(files, body.tags);
    return UploadMapper.toResponseList(uploads);
  }

  @Delete(':id')
  @PreAuthorized(PERMISSIONS.DELETE_UPLOAD)
  @HttpCode(HttpStatus.OK)
  async deleteFile(@Param('id') id: number): Promise<UploadResponseDto> {
    const upload = await this.uploadService.deleteFile(id);
    return UploadMapper.toResponse(upload);
  }

  @Get(':id')
  @PreAuthorized(PERMISSIONS.READ_UPLOAD)
  @HttpCode(HttpStatus.OK)
  async findById(@Param('id') id: number): Promise<UploadResponseDto> {
    const upload = await this.uploadService.findById(id);
    return UploadMapper.toResponse(upload);
  }

  @Get()
  @PreAuthorized(PERMISSIONS.READ_UPLOAD)
  @HttpCode(HttpStatus.OK)
  async findAll(@Query('page') page = 1, @Query('size') size = 10) {
    const result = await this.uploadService.findBy({
      page: Number(page),
      size: Number(size),
    });
    return UploadMapper.toPaginatedResponse(result);
  }
}
