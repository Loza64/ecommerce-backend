import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UploadService } from './upload.service';
import { Upload } from '../domain/entity/upload.entity';
import { CloudinaryService } from 'src/integrations/cloudinary/cloudinary.service';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

describe('UploadService', () => {
  let service: UploadService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadService,
        {
          provide: getRepositoryToken(Upload),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            findOneBy: jest.fn(),
            findOneOrFail: jest.fn(),
            findOneByOrFail: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
            softDelete: jest.fn(),
            restore: jest.fn(),
            count: jest.fn(),
          },
        },
        {
          provide: CloudinaryService,
          useValue: {
            upload: jest.fn(),
            destroy: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UploadService>(UploadService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
