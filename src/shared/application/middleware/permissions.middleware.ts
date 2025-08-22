import { Request, Response, NextFunction } from 'express';
import {
  ForbiddenException,
  UnauthorizedException,
} from '../../domain/exceptions/global-exceptions';
import { AuthenticatedRequest } from './auth.middleware';

export interface PermissionRequirement {
  action: string;
  scope?: string;
  module?: string;
}

export class PermissionsMiddleware {
  /**
   * Middleware to check if user has required permission
   */
  public static requirePermission(requirement: PermissionRequirement) {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
      try {
        // Check if user is authenticated
        if (!req.user) {
          throw new UnauthorizedException('Authentication required');
        }

        // Check if user has the required permission
        const hasPermission = PermissionsMiddleware.checkUserPermission(
          req.user.permissions || [],
          requirement
        );

        if (!hasPermission) {
          throw new ForbiddenException(
            `Access denied. Required permission: ${requirement.action}${
              requirement.scope ? `:${requirement.scope}` : ''
            }`
          );
        }

        next();
      } catch (error) {
        next(error);
      }
    };
  }

  /**
   * Middleware to check if user has any of the required permissions
   */
  public static requireAnyPermission(requirements: PermissionRequirement[]) {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
      try {
        // Check if user is authenticated
        if (!req.user) {
          throw new UnauthorizedException('Authentication required');
        }

        // Check if user has any of the required permissions
        const hasAnyPermission = requirements.some(requirement =>
          PermissionsMiddleware.checkUserPermission(req.user!.permissions || [], requirement)
        );

        if (!hasAnyPermission) {
          const permissionStrings = requirements.map(
            req => `${req.action}${req.scope ? `:${req.scope}` : ''}`
          );
          throw new ForbiddenException(
            `Access denied. Required one of: ${permissionStrings.join(', ')}`
          );
        }

        next();
      } catch (error) {
        next(error);
      }
    };
  }

  /**
   * Middleware to check if user has all required permissions
   */
  public static requireAllPermissions(requirements: PermissionRequirement[]) {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
      try {
        // Check if user is authenticated
        if (!req.user) {
          throw new UnauthorizedException('Authentication required');
        }

        // Check if user has all required permissions
        const hasAllPermissions = requirements.every(requirement =>
          PermissionsMiddleware.checkUserPermission(req.user!.permissions || [], requirement)
        );

        if (!hasAllPermissions) {
          const permissionStrings = requirements.map(
            req => `${req.action}${req.scope ? `:${req.scope}` : ''}`
          );
          throw new ForbiddenException(
            `Access denied. Required all of: ${permissionStrings.join(', ')}`
          );
        }

        next();
      } catch (error) {
        next(error);
      }
    };
  }

  /**
   * Middleware to check if user has required role
   */
  public static requireRole(roleName: string) {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
      try {
        // Check if user is authenticated
        if (!req.user) {
          throw new UnauthorizedException('Authentication required');
        }

        // Check if user has the required role
        const hasRole = req.user.roles?.includes(roleName) || false;

        if (!hasRole) {
          throw new ForbiddenException(`Access denied. Required role: ${roleName}`);
        }

        next();
      } catch (error) {
        next(error);
      }
    };
  }

  /**
   * Middleware to check if user has any of the required roles
   */
  public static requireAnyRole(roleNames: string[]) {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
      try {
        // Check if user is authenticated
        if (!req.user) {
          throw new UnauthorizedException('Authentication required');
        }

        // Check if user has any of the required roles
        const hasAnyRole = roleNames.some(roleName => req.user!.roles?.includes(roleName) || false);

        if (!hasAnyRole) {
          throw new ForbiddenException(
            `Access denied. Required one of roles: ${roleNames.join(', ')}`
          );
        }

        next();
      } catch (error) {
        next(error);
      }
    };
  }

  /**
   * Check if user has a specific permission
   */
  private static checkUserPermission(
    userPermissions: string[],
    requirement: PermissionRequirement
  ): boolean {
    // Build the permission key to check
    const permissionKey = requirement.scope
      ? `${requirement.action}:${requirement.scope}`
      : requirement.action;

    // Check exact match
    if (userPermissions.includes(permissionKey)) {
      return true;
    }

    // Check wildcard permissions (action without scope)
    if (requirement.scope && userPermissions.includes(requirement.action)) {
      return true;
    }

    // Check module-level wildcard permissions
    if (requirement.module) {
      const moduleWildcard = `${requirement.module}:*`;
      if (userPermissions.includes(moduleWildcard)) {
        return true;
      }
    }

    // Check super admin permission
    if (userPermissions.includes('*') || userPermissions.includes('admin:*')) {
      return true;
    }

    return false;
  }
}

// Common permission requirements - must match seed.ts permissions exactly
export const CommonPermissions = {
  // Auth management (auth module)
  AUTH_LOGIN: { action: 'login', scope: 'auth', module: 'auth' },
  AUTH_REGISTER: { action: 'register', scope: 'auth', module: 'auth' },
  AUTH_REFRESH: { action: 'refresh', scope: 'auth', module: 'auth' },
  AUTH_LOGOUT: { action: 'logout', scope: 'auth', module: 'auth' },

  // User management (users module)
  USER_CREATE: { action: 'create', scope: 'users', module: 'users' },
  USER_READ: { action: 'read', scope: 'users', module: 'users' },
  USER_UPDATE: { action: 'update', scope: 'users', module: 'users' },
  USER_DELETE: { action: 'delete', scope: 'users', module: 'users' },
  USER_LIST: { action: 'list', scope: 'users', module: 'users' },

  // Role management (rbac module)
  ROLE_CREATE: { action: 'create', scope: 'roles', module: 'rbac' },
  ROLE_READ: { action: 'read', scope: 'roles', module: 'rbac' },
  ROLE_UPDATE: { action: 'update', scope: 'roles', module: 'rbac' },
  ROLE_DELETE: { action: 'delete', scope: 'roles', module: 'rbac' },
  ROLE_LIST: { action: 'list', scope: 'roles', module: 'rbac' },
  ROLE_ASSIGN: { action: 'assign', scope: 'roles', module: 'rbac' },

  // Permission management (rbac module)
  PERMISSION_CREATE: { action: 'create', scope: 'permissions', module: 'rbac' },
  PERMISSION_READ: { action: 'read', scope: 'permissions', module: 'rbac' },
  PERMISSION_UPDATE: { action: 'update', scope: 'permissions', module: 'rbac' },
  PERMISSION_DELETE: { action: 'delete', scope: 'permissions', module: 'rbac' },
  PERMISSION_LIST: { action: 'list', scope: 'permissions', module: 'rbac' },

  // Module management (rbac module)
  MODULE_CREATE: { action: 'create', scope: 'modules', module: 'rbac' },
  MODULE_READ: { action: 'read', scope: 'modules', module: 'rbac' },
  MODULE_UPDATE: { action: 'update', scope: 'modules', module: 'rbac' },
  MODULE_DELETE: { action: 'delete', scope: 'modules', module: 'rbac' },
  MODULE_LIST: { action: 'list', scope: 'modules', module: 'rbac' },

  // System administration (system module)
  SYSTEM_ADMIN: { action: 'admin', scope: '*', module: 'system' },
  SYSTEM_CONFIG: { action: 'config', scope: 'system', module: 'system' },
  SYSTEM_HEALTH: { action: 'health', scope: 'system', module: 'system' },
} as const;
