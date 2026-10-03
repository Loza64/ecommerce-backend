import { PaginationMeta } from 'src/common/parser/pagination.parser';

export class PaginatedResponseDto<T> {
  data: T[];
  pagination: PaginationMeta;

  constructor(data: T[], pagination: PaginationMeta) {
    this.data = data;
    this.pagination = pagination;
  }
}
