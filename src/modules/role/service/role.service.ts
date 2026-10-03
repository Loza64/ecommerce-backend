import { Injectable, NotFoundException } from '@nestjs/common';
import { ICrudService } from 'src/common/service/crud.service';
import { Role } from '../domain/entity/role.entity';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FindOptionsOrder,
  FindOptionsRelations,
  FindOptionsWhere,
  In,
  Repository,
} from 'typeorm';
import { Permission } from 'src/modules/permission/domain/entity/permission.entity';
import { PaginationParser } from 'src/common/parser/pagination.parser';
import { paginate } from 'nestjs-typeorm-paginate';
import { CreateRoleDto, UpdateRoleDto } from '../domain/dto/payload.dto';
import { PermissionService } from 'src/modules/permission/service/permission.service';

@Injectable()
export class RoleService implements ICrudService<
  Role,
  CreateRoleDto,
  UpdateRoleDto
> {
  constructor(
    @InjectRepository(Role)
    private readonly repo: Repository<Role>,
    private readonly permissionService: PermissionService,
  ) {}

  private async resolvePermissions(ids: number[]): Promise<Permission[]> {
    if (!ids.length) return [];
    const permissionPage = await this.permissionService.findBy({
      filters: { id: In(ids) },
      page: 1,
      size: ids.length,
    });
    if (permissionPage.data.length !== ids.length)
      throw new NotFoundException('Some permissions not found');
    return permissionPage.data;
  }

  async create(data: CreateRoleDto): Promise<Role> {
    const ids = data.permissions?.map((p) => p.id) ?? [];
    const permissions = await this.resolvePermissions(ids);
    const role = this.repo.create({ ...data, permissions });
    return this.repo.save(role);
  }

  async update({
    id,
    data,
  }: {
    id: number;
    data: UpdateRoleDto;
  }): Promise<Role> {
    const role = await this.findOneBy({
      filters: { id },
      relations: { permissions: true },
    });
    const { permissions: permissionsDto, ...rest } = data;
    Object.assign(role, rest);
    if (permissionsDto) {
      const ids = permissionsDto.map((p) => p.id);
      role.permissions = await this.resolvePermissions(ids);
    }

    return this.repo.save(role);
  }

  async delete(id: number): Promise<Role> {
    const role = await this.findOneBy({ filters: { id } });
    await this.repo.remove(role);
    return role;
  }

  async softDelete(id: number): Promise<Role> {
    await this.repo.softDelete(id);
    return this.repo.findOneOrFail({ where: { id }, withDeleted: true });
  }

  async softRestore(id: number): Promise<Role> {
    const result = await this.repo.restore(id);
    if (!result.affected) throw new NotFoundException(`Role ${id} no existe`);
    return this.repo.findOneByOrFail({ id });
  }

  async findOneBy(params: {
    filters: FindOptionsWhere<Role> | FindOptionsWhere<Role>[];
    relations?: FindOptionsRelations<Role>;
  }): Promise<Role> {
    const role = await this.repo.findOne({
      where: params.filters,
      relations: params.relations,
    });
    if (!role) throw new NotFoundException('Role not found');
    return role;
  }

  async findBy(params: {
    order?: FindOptionsOrder<Role>;
    filters: FindOptionsWhere<Role> | FindOptionsWhere<Role>[];
    relations?: FindOptionsRelations<Role>;
    page: number;
    size: number;
    withDeleted?: boolean;
  }): Promise<PaginationParser<Role>> {
    const result = await paginate<Role>(
      this.repo,
      { page: params.page, limit: params.size },
      {
        where: params.filters,
        relations: params.relations,
        order: params.order,
        withDeleted: params.withDeleted,
      },
    );
    return new PaginationParser(result);
  }

  async count(
    filters?: FindOptionsWhere<Role> | FindOptionsWhere<Role>[],
  ): Promise<number> {
    return this.repo.count({ where: filters });
  }
}
