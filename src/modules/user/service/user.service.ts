import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ICrudService } from 'src/common/service/crud.service';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FindOptionsOrder,
  FindOptionsRelations,
  FindOptionsWhere,
  Repository,
} from 'typeorm';
import { PaginationParser } from 'src/common/parser/pagination.parser';
import { paginate } from 'nestjs-typeorm-paginate';
import { CryptoService } from 'src/integrations/crypto/crypto.service';
import { User } from '../domain/entity/user.entity';
import { CreateUserDto, UpdateUserDto } from '../domain/dto/payload.dto';
import { UploadService } from 'src/modules/upload/service/upload.service';

@Injectable()
export class UserService implements ICrudService<
  User,
  CreateUserDto,
  UpdateUserDto
> {
  constructor(
    @InjectRepository(User) private readonly repo: Repository<User>,
    private readonly upload: UploadService,
    private readonly cryptoService: CryptoService,
  ) {}

  async create(data: CreateUserDto): Promise<User> {
    const existing = await this.repo.findOne({
      where: [{ username: data.username }, { email: data.email }],
    });
    if (existing)
      throw new ConflictException('Username o email ya están en uso');

    const hashedPassword = await this.cryptoService.encrypt(data.password);
    const user = this.repo.create({ ...data, password: hashedPassword });
    return this.repo.save(user);
  }

  async update({
    id,
    data,
  }: {
    id: number;
    data: UpdateUserDto;
  }): Promise<User> {
    const user = await this.findOneBy({
      filters: { id },
      relations: { photo: true },
    });
    const { photo: newPhoto, ...rest } = data;
    Object.assign(user, rest);
    const oldPhotoId = user.photo?.id;
    if (newPhoto) user.photo = { id: newPhoto.id } as User['photo'];
    const savedUser = await this.repo.save(user);
    if (newPhoto?.id && oldPhotoId && newPhoto.id !== oldPhotoId)
      await this.upload.deleteFile(oldPhotoId);
    return savedUser;
  }

  async delete(id: number): Promise<User> {
    const user = await this.findOneBy({ filters: { id } });
    await this.repo.remove(user);
    return user;
  }

  async softDelete(id: number): Promise<User> {
    await this.repo.softDelete(id);
    return this.repo.findOneOrFail({ where: { id }, withDeleted: true });
  }

  async softRestore(id: number): Promise<User> {
    const result = await this.repo.restore(id);
    if (!result.affected) throw new NotFoundException(`User ${id} no existe`);
    return this.repo.findOneByOrFail({ id });
  }

  async findOneBy(params: {
    filters: FindOptionsWhere<User> | FindOptionsWhere<User>[];
    relations?: FindOptionsRelations<User>;
  }): Promise<User> {
    const user = await this.repo.findOne({
      where: params.filters,
      relations: params.relations,
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findBy(params: {
    order?: FindOptionsOrder<User>;
    filters: FindOptionsWhere<User> | FindOptionsWhere<User>[];
    relations?: FindOptionsRelations<User>;
    page: number;
    size: number;
    withDeleted?: boolean;
  }): Promise<PaginationParser<User>> {
    const result = await paginate<User>(
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
    filters?: FindOptionsWhere<User> | FindOptionsWhere<User>[],
  ): Promise<number> {
    return this.repo.count({ where: filters });
  }
}
