import { PermissionMapper } from './permission.mapper';
import { describe, it, expect } from '@jest/globals';

describe('PermissionMapper', () => {
  it('should be defined', () => {
    expect(PermissionMapper).toBeDefined();
  });

  it('should have toResponse fn', () => {
    expect(typeof PermissionMapper.toResponse).toBe('function');
  });

  it('should have toResponseList fn', () => {
    expect(typeof PermissionMapper.toResponseList).toBe('function');
  });

  it('should have toPaginatedResponse fn', () => {
    expect(typeof PermissionMapper.toPaginatedResponse).toBe('function');
  });
});
