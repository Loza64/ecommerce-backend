import { Request } from 'express';
import { User } from 'src/modules/user/domain/entity/user.entity';

export interface RequestWithUser extends Request {
  user?: User;
}
