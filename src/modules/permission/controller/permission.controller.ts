import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Put,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { PermissionUpdateDto } from '../domain/dto/permision.update.dto';
import { PermissionMapper } from '../domain/mappers/permission.mapper';
import { PermissionResponseDto } from '../domain/dto/response.dto';
import { PermissionService } from '../service/permission.service';
import { PreAuthorized } from 'src/common/decorators/pre-authorized';
import { PERMISSIONS } from 'src/common/constants/permissions';

@Controller('/permissions')
export class PermissionController {
  constructor(private readonly service: PermissionService) {}

  @Get()
  @PreAuthorized(PERMISSIONS.READ_PERMISSION)
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('size', new DefaultValuePipe(10), ParseIntPipe) size: number,
  ) {
    const result = await this.service.findBy({ page, size, filters: {} });
    return PermissionMapper.toPaginatedResponse(result);
  }

  @Get(':id')
  @PreAuthorized(PERMISSIONS.READ_PERMISSION)
  @HttpCode(HttpStatus.OK)
  async getOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<PermissionResponseDto> {
    const permission = await this.service.findOneBy({ filters: { id } });
    return PermissionMapper.toResponse(permission);
  }

  @Put(':id')
  @PreAuthorized(PERMISSIONS.UPDATE_PERMISSION)
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: PermissionUpdateDto,
  ): Promise<PermissionResponseDto> {
    const permission = await this.service.update({ id, data });
    return PermissionMapper.toResponse(permission);
  }
}
