import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmExceptionFilter } from './typeorm.exception.filter';
import { describe, beforeEach, it, expect } from '@jest/globals';

describe('TypeOrmExceptionFilter', () => {
  let filter: TypeOrmExceptionFilter;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TypeOrmExceptionFilter],
    }).compile();

    filter = module.get<TypeOrmExceptionFilter>(TypeOrmExceptionFilter);
  });

  it('should be defined', () => {
    expect(filter).toBeDefined();
  });
});
