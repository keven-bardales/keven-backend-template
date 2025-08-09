import { BaseRepository } from '../../../../shared/domain/repositories/base.repository';
import { PermissionEntity } from '../entities/permission.entity';

export interface CreatePermissionData {
  moduleId: string;
  action: string;
  scope?: string;
  name: string;
  description?: string;
}

export interface UpdatePermissionData {
  name?: string;
  description?: string;
}

export abstract class PermissionRepository extends BaseRepository<
  PermissionEntity,
  CreatePermissionData,
  UpdatePermissionData
> {
  abstract findByModuleAndAction(
    moduleId: string,
    action: string,
    scope?: string
  ): Promise<PermissionEntity | null>;
  abstract findByModule(moduleId: string): Promise<PermissionEntity[]>;
  abstract findByAction(action: string): Promise<PermissionEntity[]>;
  abstract existsByModuleAndAction(
    moduleId: string,
    action: string,
    scope?: string
  ): Promise<boolean>;
  abstract findPermissionsByRoleId(roleId: string): Promise<PermissionEntity[]>;
  abstract findPermissionsByUserId(userId: string): Promise<PermissionEntity[]>;
  abstract findPermissionsByRoleIds(roleIds: string[]): Promise<PermissionEntity[]>;
  abstract searchPermissions(
    searchTerm: string,
    options?: {
      skip?: number;
      take?: number;
      moduleId?: string;
    }
  ): Promise<PermissionEntity[]>;
  abstract countPermissionsByModule(moduleId: string): Promise<number>;
  abstract bulkCreate(permissions: CreatePermissionData[]): Promise<PermissionEntity[]>;
  abstract bulkDelete(permissionIds: string[]): Promise<void>;
}
