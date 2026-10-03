import {
  DeepPartial,
  FindOptionsOrder,
  FindOptionsRelations,
  FindOptionsWhere,
  ObjectLiteral,
} from 'typeorm';
import { PaginationParser } from '../parser/pagination.parser';

export abstract class ICrudService<
  T extends ObjectLiteral,
  CreateDto = DeepPartial<T>,
  UpdateDto = DeepPartial<T>,
> {
  abstract create(data: CreateDto): Promise<T>;
  abstract update(params: { id: number; data: UpdateDto }): Promise<T>;
  abstract delete(id: number): Promise<T>;
  abstract softDelete(id: number): Promise<T>;
  abstract softRestore(id: number): Promise<T>;
  abstract findOneBy(params: {
    filters: FindOptionsWhere<T> | FindOptionsWhere<T>[];
    relations?: FindOptionsRelations<T>;
  }): Promise<T>;
  abstract findBy(params: {
    order?: FindOptionsOrder<T>;
    filters: FindOptionsWhere<T> | FindOptionsWhere<T>[];
    relations?: FindOptionsRelations<T>;
    page: number;
    size: number;
    withDeleted?: boolean;
  }): Promise<PaginationParser<T>>;
  abstract count(
    filters?: FindOptionsWhere<T> | FindOptionsWhere<T>[],
  ): Promise<number>;
}
