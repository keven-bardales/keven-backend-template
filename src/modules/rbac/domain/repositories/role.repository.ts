import { BaseRepository } from '../../../../shared/domain/repositories/base.repository';
import { RoleEntity } from '../entities/role.entity';

export interface CreateRoleData {
  name: string;
  description?: string;
  isSystem?: boolean;
}

export interface UpdateRoleData {
  name?: string;
  description?: string;
}

export abstract class RoleRepository extends BaseRepository<
  RoleEntity,
  CreateRoleData,
  UpdateRoleData
> {
  abstract findByName(name: string): Promise<RoleEntity | null>;
  abstract findSystemRoles(): Promise<RoleEntity[]>;
  abstract findNonSystemRoles(): Promise<RoleEntity[]>;
  abstract existsByName(name: string): Promise<boolean>;
  abstract findRolesWithPermissions(roleIds: string[]): Promise<RoleEntity[]>;
  abstract assignPermissionToRole(roleId: string, permissionId: string): Promise<void>;
  abstract removePermissionFromRole(roleId: string, permissionId: string): Promise<void>;
  abstract getRolePermissions(roleId: string): Promise<string[]>;
  abstract findRolesByUserId(userId: string): Promise<RoleEntity[]>;
  abstract assignRoleToUser(userId: string, roleId: string): Promise<void>;
  abstract removeRoleFromUser(userId: string, roleId: string): Promise<void>;
  abstract getUserRoles(userId: string): Promise<string[]>;
  abstract bulkAssignRolesToUser(userId: string, roleIds: string[]): Promise<void>;
  abstract bulkRemoveRolesFromUser(userId: string, roleIds: string[]): Promise<void>;
}
