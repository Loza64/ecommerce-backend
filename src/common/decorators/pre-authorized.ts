import { SetMetadata } from '@nestjs/common';

export const PRE_AUTHORIZED_KEY = 'preAuthorized';
export const PreAuthorized = (permission: string) =>
  SetMetadata(PRE_AUTHORIZED_KEY, permission);
