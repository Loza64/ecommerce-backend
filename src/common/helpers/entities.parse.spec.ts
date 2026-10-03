import { parseSearch, parseSort } from './entities.parse';
import { describe, it, expect } from '@jest/globals';

describe('entities.parse', () => {
  it('should have parseSearch fn', () => {
    expect(typeof parseSearch).toBe('function');
  });

  it('should have parseSort fn', () => {
    expect(typeof parseSort).toBe('function');
  });
});
