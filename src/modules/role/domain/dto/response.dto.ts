import { BaseResponse } from 'src/common/dto/base-response.dto';
import { PermissionResponseDto } from 'src/modules/permission/domain/dto/response.dto';

export class RoleResponseDto extends BaseResponse {
  name?: string;
  active?: boolean;
  permissions?: PermissionResponseDto[];
}
