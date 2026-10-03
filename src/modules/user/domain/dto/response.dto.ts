import { BaseResponse } from 'src/common/dto/base-response.dto';
import { RoleResponseDto } from 'src/modules/role/domain/dto/response.dto';
import { UploadResponseDto } from 'src/modules/upload/domain/dto/response.dto';

export class UserResponseDto extends BaseResponse {
  username!: string;
  name!: string;
  surname!: string;
  email!: string;
  blocked!: boolean;
  role!: RoleResponseDto | null;
  photo!: UploadResponseDto | null;
}
