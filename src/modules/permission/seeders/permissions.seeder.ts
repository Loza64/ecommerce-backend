import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { PERMISSIONS } from '../../../common/constants/permissions';
import { PermissionService } from '../service/permission.service';

@Injectable()
export class PermissionsSeeder implements OnApplicationBootstrap {
  constructor(private readonly permissionsService: PermissionService) {}

  async onApplicationBootstrap(): Promise<void> {
    const permissionNames: string[] = Object.values(PERMISSIONS);

    await Promise.allSettled(
      permissionNames.map((name) => this.permissionsService.upsert({ name })),
    );
  }
}
