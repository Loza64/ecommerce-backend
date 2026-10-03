import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { PermissionsGuard } from './permissions.guard';
import { PRE_AUTHORIZED_KEY } from 'src/common/decorators/pre-authorized';

describe('PermissionsGuard', () => {
  let reflector: Reflector;
  let guard: PermissionsGuard;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as unknown as Reflector;
    guard = new PermissionsGuard(reflector);
  });

  it('allows endpoints without a required permission', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

    expect(guard.canActivate(createContext(undefined))).toBe(true);
  });

  it('allows a user with the required permission', () => {
    const getAllAndOverride = jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue('users.read');
    const context = createContext({
      role: { name: 'USER', permissions: [{ name: 'users.read' }] },
    });

    expect(guard.canActivate(context)).toBe(true);
    expect(getAllAndOverride).toHaveBeenCalledWith(
      PRE_AUTHORIZED_KEY,
      expect.any(Array),
    );
  });

  it('allows every permission to the super administrator', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue('users.delete');
    const context = createContext({
      role: { name: 'SUPER_ADMIN', permissions: [] },
    });

    expect(guard.canActivate(context)).toBe(true);
  });
});

function createContext(user: unknown): ExecutionContext {
  return {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  } as unknown as ExecutionContext;
}
