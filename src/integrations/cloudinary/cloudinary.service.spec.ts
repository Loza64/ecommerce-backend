import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { CloudinaryService } from './cloudinary.service';
import { CloudinaryService as ExternalCloudinaryService } from '@scwar/nestjs-cloudinary';
import { CircuitBreakerFactory } from 'src/shared/resilience/circuit-breaker.factory';
import { CircuitBreakerRegistry } from 'src/shared/resilience/circuit-breaker.registry';
import { describe, beforeEach, jest, it, expect } from '@jest/globals';

describe('CloudinaryService', () => {
  let service: CloudinaryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CloudinaryService,
        CircuitBreakerFactory,
        CircuitBreakerRegistry,
        {
          provide: ConfigService,
          useValue: { get: jest.fn() },
        },
        {
          provide: ExternalCloudinaryService,
          useValue: {
            upload: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CloudinaryService>(CloudinaryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
