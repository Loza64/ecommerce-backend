import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RequestWithUser } from 'src/common/models/request-with-user';
import { PRE_AUTHORIZED_KEY } from 'src/common/decorators/pre-authorized';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermission = this.reflector.getAllAndOverride<string>(
      PRE_AUTHORIZED_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermission) return true;

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    if (!user) throw new UnauthorizedException('User not authenticated');

    const isSuperAdmin = user.role?.name === 'SUPER_ADMIN';
    const hasPermission = user.role?.permissions?.some(
      (permission) => permission.name === requiredPermission,
    );

    if (!isSuperAdmin && !hasPermission) {
      throw new ForbiddenException('Permission denied');
    }

    return true;
  }
}
