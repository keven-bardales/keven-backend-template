import { Request, Response, NextFunction } from 'express';
import {
  ForbiddenException,
  UnauthorizedException,
} from '../../domain/exceptions/global-exceptions';
import { AuthenticatedRequest, AuthenticatedUser } from './auth.middleware';
import { PermissionRepository } from '../../../modules/rbac/domain/repositories/permission.repository';
import { RoleRepository } from '../../../modules/rbac/domain/repositories/role.repository';

export interface PermissionCheckOptions {
  module: string;
  action: string;
  scope?: string;
  operator?: 'AND' | 'OR';
}

export class PermissionMiddleware {
  private static permissionRepository: PermissionRepository;
  private static roleRepository: RoleRepository;

  public static setRepositories(
    permissionRepository: PermissionRepository,
    roleRepository: RoleRepository
  ) {
    PermissionMiddleware.permissionRepository = permissionRepository;
    PermissionMiddleware.roleRepository = roleRepository;
  }

  public static requirePermission(permissions: PermissionCheckOptions | PermissionCheckOptions[]) {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
      try {
        if (!req.user) {
          throw new UnauthorizedException('User not authenticated');
        }

        const permissionList = Array.isArray(permissions) ? permissions : [permissions];
        const hasPermission = await PermissionMiddleware.checkUserPermissions(
          req.user,
          permissionList
        );

        if (!hasPermission) {
          const permissionNames = permissionList.map(
            p => `${p.module}:${p.action}${p.scope ? ':' + p.scope : ''}`
          );
          throw new ForbiddenException(
            `Access denied. Required permissions: ${permissionNames.join(', ')}`
          );
        }

        next();
      } catch (error) {
        next(error);
      }
    };
  }

  public static requireRole(roles: string | string[], operator: 'AND' | 'OR' = 'OR') {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
      try {
        if (!req.user) {
          throw new UnauthorizedException('User not authenticated');
        }

        const roleList = Array.isArray(roles) ? roles : [roles];
        const userRoles = await PermissionMiddleware.getUserRoles(req.user.id);

        const hasRole =
          operator === 'AND'
            ? roleList.every(role => userRoles.includes(role))
            : roleList.some(role => userRoles.includes(role));

        if (!hasRole) {
          throw new ForbiddenException(
            `Access denied. Required roles: ${roleList.join(operator === 'AND' ? ' AND ' : ' OR ')}`
          );
        }

        next();
      } catch (error) {
        next(error);
      }
    };
  }

  public static requireAny(permissions?: PermissionCheckOptions[], roles?: string[]) {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
      try {
        if (!req.user) {
          throw new UnauthorizedException('User not authenticated');
        }

        let hasAccess = false;

        // Check permissions
        if (permissions && permissions.length > 0) {
          hasAccess = await PermissionMiddleware.checkUserPermissions(req.user, permissions);
        }

        // Check roles if no permission match
        if (!hasAccess && roles && roles.length > 0) {
          const userRoles = await PermissionMiddleware.getUserRoles(req.user.id);
          hasAccess = roles.some(role => userRoles.includes(role));
        }

        if (!hasAccess) {
          const requiredAccess = [];
          if (permissions) {
            requiredAccess.push(
              ...permissions.map(p => `${p.module}:${p.action}${p.scope ? ':' + p.scope : ''}`)
            );
          }
          if (roles) {
            requiredAccess.push(...roles.map(r => `role:${r}`));
          }
          throw new ForbiddenException(`Access denied. Required: ${requiredAccess.join(' OR ')}`);
        }

        next();
      } catch (error) {
        next(error);
      }
    };
  }

  public static requireOwnershipOrPermission(
    getResourceOwnerId: (req: AuthenticatedRequest) => Promise<string> | string,
    fallbackPermissions: PermissionCheckOptions[]
  ) {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
      try {
        if (!req.user) {
          throw new UnauthorizedException('User not authenticated');
        }

        // First check if user owns the resource
        const resourceOwnerId = await getResourceOwnerId(req);
        if (resourceOwnerId === req.user.id) {
          return next();
        }

        // If not owner, check fallback permissions
        const hasPermission = await PermissionMiddleware.checkUserPermissions(
          req.user,
          fallbackPermissions
        );
        if (!hasPermission) {
          throw new ForbiddenException(
            'Access denied. You can only access your own resources or need specific permissions.'
          );
        }

        next();
      } catch (error) {
        next(error);
      }
    };
  }

  public static adminOnly() {
    return PermissionMiddleware.requireRole(['admin', 'super_admin']);
  }

  public static superAdminOnly() {
    return PermissionMiddleware.requireRole('super_admin');
  }

  private static async checkUserPermissions(
    user: AuthenticatedUser,
    permissions: PermissionCheckOptions[],
    operator: 'AND' | 'OR' = 'OR'
  ): Promise<boolean> {
    try {
      if (!PermissionMiddleware.permissionRepository) {
        console.warn('⚠️  Permission repository not configured, using basic check');
        // Fallback to basic permission check from token
        return permissions.some(perm => {
          const permKey = `${perm.module}:${perm.action}${perm.scope ? ':' + perm.scope : ''}`;
          return user.permissions.includes(permKey);
        });
      }

      const userPermissions =
        await PermissionMiddleware.permissionRepository.findPermissionsByUserId(user.id);

      const hasPermission =
        operator === 'AND'
          ? permissions.every(perm =>
              userPermissions.some(
                up => up.moduleId === perm.module && up.matches(perm.action, perm.scope)
              )
            )
          : permissions.some(perm =>
              userPermissions.some(
                up => up.moduleId === perm.module && up.matches(perm.action, perm.scope)
              )
            );

      return hasPermission;
    } catch (error) {
      console.error('Error checking user permissions:', error);
      return false;
    }
  }

  private static async getUserRoles(userId: string): Promise<string[]> {
    try {
      if (!PermissionMiddleware.roleRepository) {
        console.warn('⚠️  Role repository not configured, using basic check');
        return [];
      }

      const userRoles = await PermissionMiddleware.roleRepository.findRolesByUserId(userId);
      return userRoles.map(role => role.name);
    } catch (error) {
      console.error('Error getting user roles:', error);
      return [];
    }
  }
}

// Common permission patterns
export const CommonPermissions = {
  // User management
  USER_READ: { module: 'users', action: 'read' },
  USER_CREATE: { module: 'users', action: 'create' },
  USER_UPDATE: { module: 'users', action: 'update' },
  USER_DELETE: { module: 'users', action: 'delete' },
  USER_MANAGE_ROLES: { module: 'users', action: 'manage_roles' },

  // Role management
  ROLE_READ: { module: 'roles', action: 'read' },
  ROLE_CREATE: { module: 'roles', action: 'create' },
  ROLE_UPDATE: { module: 'roles', action: 'update' },
  ROLE_DELETE: { module: 'roles', action: 'delete' },
  ROLE_ASSIGN: { module: 'roles', action: 'assign' },

  // Permission management
  PERMISSION_READ: { module: 'permissions', action: 'read' },
  PERMISSION_CREATE: { module: 'permissions', action: 'create' },
  PERMISSION_UPDATE: { module: 'permissions', action: 'update' },
  PERMISSION_DELETE: { module: 'permissions', action: 'delete' },
  PERMISSION_ASSIGN: { module: 'permissions', action: 'assign' },

  // Module management
  MODULE_READ: { module: 'modules', action: 'read' },
  MODULE_CREATE: { module: 'modules', action: 'create' },
  MODULE_UPDATE: { module: 'modules', action: 'update' },
  MODULE_DELETE: { module: 'modules', action: 'delete' },

  // System administration
  SYSTEM_ADMIN: { module: 'system', action: 'admin' },
  SYSTEM_CONFIG: { module: 'system', action: 'config' },
} as const;

// Permission decorators/helpers
export function hasPermission(permission: PermissionCheckOptions) {
  return PermissionMiddleware.requirePermission(permission);
}

export function hasRole(roles: string | string[]) {
  return PermissionMiddleware.requireRole(roles);
}

export function hasAnyPermission(permissions: PermissionCheckOptions[]) {
  return PermissionMiddleware.requirePermission(permissions);
}

export function isOwnerOr(
  getOwnerId: (req: AuthenticatedRequest) => Promise<string> | string,
  fallbackPermissions: PermissionCheckOptions[]
) {
  return PermissionMiddleware.requireOwnershipOrPermission(getOwnerId, fallbackPermissions);
}
