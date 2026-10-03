import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from '../service/user.service';
import { UploadService } from 'src/modules/upload/service/upload.service';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

describe('UserController', () => {
  let controller: UserController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: {
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            softDelete: jest.fn(),
            softRestore: jest.fn(),
            findOneBy: jest.fn(),
            findBy: jest.fn(),
            count: jest.fn(),
          },
        },
        {
          provide: UploadService,
          useValue: {
            uploadFile: jest.fn(),
            uploadManyFiles: jest.fn(),
            deleteFile: jest.fn(),
            findById: jest.fn(),
            findBy: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
