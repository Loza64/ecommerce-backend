import { Test, TestingModule } from '@nestjs/testing';
import { CryptoService } from './crypto.service';
import { describe, beforeEach, it, expect } from '@jest/globals';

describe('CryptoService', () => {
  let service: CryptoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CryptoService],
    }).compile();

    service = module.get<CryptoService>(CryptoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
