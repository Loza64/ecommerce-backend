import { Test, TestingModule } from '@nestjs/testing';
import { UploadInterceptor } from './upload.interceptor';
import { describe, beforeEach, it, expect } from '@jest/globals';

describe('UploadInterceptor', () => {
  let interceptor: UploadInterceptor;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UploadInterceptor],
    }).compile();

    interceptor = module.get<UploadInterceptor>(UploadInterceptor);
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });
});
