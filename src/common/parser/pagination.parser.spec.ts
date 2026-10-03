import { PaginationParser, PaginationMeta } from './pagination.parser';
import { describe, it, expect } from '@jest/globals';

describe('PaginationParser', () => {
  it('PaginationParser should be defined', () => {
    expect(PaginationParser).toBeDefined();
  });

  it('PaginationMeta should be defined', () => {
    expect(PaginationMeta).toBeDefined();
  });
});
