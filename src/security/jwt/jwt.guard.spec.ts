import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthGuard } from './jwt.guard';
import { Reflector } from '@nestjs/core';
import { beforeEach, describe, expect, it } from '@jest/globals';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [JwtAuthGuard, Reflector],
    }).compile();

    guard = module.get<JwtAuthGuard>(JwtAuthGuard);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });
});
