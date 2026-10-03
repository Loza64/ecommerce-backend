import { BadRequestException } from '@nestjs/common';
import {
  FindOperator,
  FindOptionsOrder,
  FindOptionsWhere,
  ILike,
} from 'typeorm';
import { BaseEntity } from '../entity/base';

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    !(value instanceof FindOperator) &&
    value.constructor === Object
  );
}

function buildNested(path: string, value: unknown): Record<string, unknown> {
  return path
    .split('.')
    .reduceRight<unknown>((acc, key) => ({ [key]: acc }), value) as Record<
    string,
    unknown
  >;
}

function deepMerge(
  target: Record<string, unknown>,
  source: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...target };
  for (const [key, value] of Object.entries(source)) {
    const existing = out[key];
    out[key] =
      isPlainObject(existing) && isPlainObject(value)
        ? deepMerge(existing, value)
        : value;
  }
  return out;
}

export function parseSearch<TEntity>(
  search: string | undefined,
  fields: string[],
  baseFilter: FindOptionsWhere<TEntity> = {},
): FindOptionsWhere<TEntity> | FindOptionsWhere<TEntity>[] {
  if (!search?.trim()) return baseFilter;

  const matcher = ILike(`%${search.trim()}%`);

  return fields.map(
    (field) =>
      deepMerge(
        baseFilter,
        buildNested(field, matcher),
      ) as FindOptionsWhere<TEntity>,
  );
}

const VALID_ORDERS = ['asc', 'desc'];

interface ParseSortOptions<T extends BaseEntity> {
  sort?: string[];
  forbiddenFields?: (keyof T)[];
  defaultSort?: FindOptionsOrder<T>;
}

export function parseSort<T extends BaseEntity>({
  sort,
  forbiddenFields,
  defaultSort = {},
}: ParseSortOptions<T>): FindOptionsOrder<T> {
  if (!sort || sort.length === 0) return defaultSort;

  const sortData: Record<string, 'ASC' | 'DESC'> = {};

  sort.forEach((item) => {
    const [field, order] = item.split(',');
    if (!field || !order || !VALID_ORDERS.includes(order.toLowerCase()))
      throw new BadRequestException(
        `sort inválido: "${item}", formato esperado "campo,asc"`,
      );
    if (forbiddenFields?.includes(field as keyof T))
      throw new BadRequestException(
        `no se puede ordenar por el campo "${field}"`,
      );
    sortData[field] = order.toUpperCase() as 'ASC' | 'DESC';
  });

  return sortData as FindOptionsOrder<T>;
}
