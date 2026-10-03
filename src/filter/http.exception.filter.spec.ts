import { Test, TestingModule } from '@nestjs/testing';
import { HttpExceptionFilter } from './http.exception.filter';
import { describe, beforeEach, it, expect } from '@jest/globals';

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HttpExceptionFilter],
    }).compile();

    filter = module.get<HttpExceptionFilter>(HttpExceptionFilter);
  });

  it('should be defined', () => {
    expect(filter).toBeDefined();
  });
});
