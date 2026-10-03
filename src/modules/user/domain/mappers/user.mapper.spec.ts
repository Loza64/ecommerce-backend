import { UserMapper } from './user.mapper';
import { describe, it, expect } from '@jest/globals';

describe('UserMapper', () => {
  it('should be defined', () => {
    expect(UserMapper).toBeDefined();
  });

  it('should have toResponse fn', () => {
    expect(typeof UserMapper.toResponse).toBe('function');
  });

  it('should have toResponseList fn', () => {
    expect(typeof UserMapper.toResponseList).toBe('function');
  });

  it('should have toPaginatedResponse fn', () => {
    expect(typeof UserMapper.toPaginatedResponse).toBe('function');
  });
});
