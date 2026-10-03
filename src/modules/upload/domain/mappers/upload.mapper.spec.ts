import { UploadMapper } from './upload.mapper';
import { describe, it, expect } from '@jest/globals';

describe('UploadMapper', () => {
  it('should be defined', () => {
    expect(UploadMapper).toBeDefined();
  });

  it('should have toResponse fn', () => {
    expect(typeof UploadMapper.toResponse).toBe('function');
  });

  it('should have toResponseList fn', () => {
    expect(typeof UploadMapper.toResponseList).toBe('function');
  });

  it('should have toPaginatedResponse fn', () => {
    expect(typeof UploadMapper.toPaginatedResponse).toBe('function');
  });
});
