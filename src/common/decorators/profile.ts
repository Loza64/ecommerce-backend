import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from 'src/modules/user/domain/entity/user.entity';

interface RequestResponse extends Request {
  user: User;
}

export const Profile = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): User => {
    const request = ctx.switchToHttp().getRequest<RequestResponse>();
    return request.user;
  },
);
