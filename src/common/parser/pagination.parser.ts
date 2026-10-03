import { IPaginationMeta, Pagination } from 'nestjs-typeorm-paginate';

export class PaginationMeta {
  readonly page: number;
  readonly pageSize: number;
  readonly pageCount: number;
  readonly total: number;

  constructor(meta: IPaginationMeta) {
    this.page = meta.currentPage;
    this.pageSize = meta.itemsPerPage;
    this.pageCount = meta.totalPages ?? 0;
    this.total = meta.totalItems ?? 0;
  }
}

export class PaginationParser<T> {
  readonly data: T[];
  readonly pagination: PaginationMeta;

  constructor(pagination: Pagination<T, IPaginationMeta>) {
    this.data = pagination.items;
    this.pagination = new PaginationMeta(pagination.meta);
  }
}
