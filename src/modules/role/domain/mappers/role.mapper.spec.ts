import { RoleMapper } from './role.mapper';
import { describe, it, expect } from '@jest/globals';

describe('RoleMapper', () => {
  it('should be defined', () => {
    expect(RoleMapper).toBeDefined();
  });

  it('should have toResponse fn', () => {
    expect(typeof RoleMapper.toResponse).toBe('function');
  });

  it('should have toResponseList fn', () => {
    expect(typeof RoleMapper.toResponseList).toBe('function');
  });

  it('should have toPaginatedResponse fn', () => {
    expect(typeof RoleMapper.toPaginatedResponse).toBe('function');
  });
});
