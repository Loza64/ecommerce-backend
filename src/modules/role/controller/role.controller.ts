import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Param,
  Body,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import BaseQuerys from 'src/common/dto/base-querys.dto';
import { FindOptionsWhere, IsNull, Not } from 'typeorm';
import { parseSearch, parseSort } from 'src/common/helpers/entities.parse';
import { RoleService } from '../service/role.service';
import { Role } from '../domain/entity/role.entity';
import { RoleResponseDto } from '../domain/dto/response.dto';
import { RoleMapper } from '../domain/mappers/role.mapper';
import { CreateRoleDto, UpdateRoleDto } from '../domain/dto/payload.dto';
import { PreAuthorized } from 'src/common/decorators/pre-authorized';
import { PERMISSIONS } from '../../../common/constants/permissions';

@Controller('roles')
export class RoleController {
  constructor(private readonly rolesService: RoleService) {}

  @Get()
  @PreAuthorized(PERMISSIONS.READ_ROLE)
  @HttpCode(HttpStatus.OK)
  async findAll(@Query() query: BaseQuerys) {
    const { page, pageSize: size, deleted, search, sort } = query;

    const baseFilter: FindOptionsWhere<Role> = {};
    baseFilter.deletedAt = deleted ? Not(IsNull()) : IsNull();

    const filters = parseSearch<Role>(search, ['name'], baseFilter);
    const order = parseSort<Role>({ sort, forbiddenFields: ['permissions'] });

    const result = await this.rolesService.findBy({
      withDeleted: deleted,
      filters,
      order,
      page: page,
      size: size,
    });

    return RoleMapper.toPaginatedResponse(result);
  }

  @Get(':id')
  @PreAuthorized(PERMISSIONS.READ_ROLE)
  @HttpCode(HttpStatus.OK)
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<RoleResponseDto> {
    const role = await this.rolesService.findOneBy({
      filters: { id },
      relations: { permissions: true },
    });
    return RoleMapper.toResponse(role);
  }

  @Post()
  @PreAuthorized(PERMISSIONS.CREATE_ROLE)
  async create(@Body() data: CreateRoleDto): Promise<RoleResponseDto> {
    const role = await this.rolesService.create(data);
    return RoleMapper.toResponse(role);
  }

  @Put(':id')
  @PreAuthorized(PERMISSIONS.UPDATE_ROLE)
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateRoleDto,
  ): Promise<RoleResponseDto> {
    const role = await this.rolesService.update({ id, data });
    return RoleMapper.toResponse(role);
  }

  @Delete(':id')
  @PreAuthorized(PERMISSIONS.DELETE_ROLE)
  @HttpCode(HttpStatus.OK)
  async softDelete(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<RoleResponseDto> {
    const role = await this.rolesService.softDelete(id);
    return RoleMapper.toResponse(role);
  }

  @Patch(':id/restore')
  @PreAuthorized(PERMISSIONS.RESTORE_ROLE)
  @HttpCode(HttpStatus.OK)
  async restore(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<RoleResponseDto> {
    const role = await this.rolesService.softRestore(id);
    return RoleMapper.toResponse(role);
  }
}
