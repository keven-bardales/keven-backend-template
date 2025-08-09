/**
 * @swagger
 * tags:
 *   name: Roles
 *   description: Role-based access control (RBAC) role management
 */
import { Router } from 'express';
import { RolesController } from '../controllers/roles.controller';
import { AuthMiddleware } from '../../../../shared/application/middleware/auth.middleware';
import { RateLimitMiddleware } from '../../../../api/middleware/rate-limit.middleware';
import {
  PermissionMiddleware,
  CommonPermissions,
} from '../../../../shared/application/middleware/permission.middleware';

export class RolesRoutes {
  private readonly router: Router;

  constructor(private readonly rolesController: RolesController) {
    this.router = Router();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    // All role routes require authentication and rate limiting
    this.router.use(RateLimitMiddleware.rbac());
    this.router.use(AuthMiddleware.authenticate());

    /**
     * @swagger
     * /rbac/roles:
     *   post:
     *     summary: Create a new role
     *     description: Create a new role with specified name and description
     *     tags: [Roles]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - name
     *             properties:
     *               name:
     *                 type: string
     *                 maxLength: 50
     *                 description: Role name (unique)
     *               description:
     *                 type: string
     *                 maxLength: 255
     *                 description: Role description
     *               isSystem:
     *                 type: boolean
     *                 description: Whether this is a system role (cannot be deleted)
     *                 default: false
     *     responses:
     *       200:
     *         description: Role created successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 status:
     *                   type: string
     *                   example: success
     *                 statusCode:
     *                   type: number
     *                   example: 200
     *                 message:
     *                   type: string
     *                   example: Role created successfully
     *                 data:
     *                   type: object
     *                   properties:
     *                     id:
     *                       type: string
     *                       format: uuid
     *                     name:
     *                       type: string
     *                     description:
     *                       type: string
     *                     isSystem:
     *                       type: boolean
     *                     createdAt:
     *                       type: string
     *                       format: date-time
     *                     updatedAt:
     *                       type: string
     *                       format: date-time
     *       400:
     *         description: Invalid role data
     *       401:
     *         description: Authentication required
     *       403:
     *         description: Insufficient permissions
     *       409:
     *         description: Role already exists
     *       500:
     *         description: Server error
     */
    this.router.post(
      '/',
      PermissionMiddleware.requirePermission(CommonPermissions.ROLE_CREATE),
      this.asyncHandler(this.rolesController.createRole.bind(this.rolesController))
    );

    /**
     * @swagger
     * /rbac/roles:
     *   get:
     *     summary: List roles
     *     description: Get a paginated list of roles with optional filtering
     *     tags: [Roles]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: query
     *         name: skip
     *         schema:
     *           type: integer
     *           minimum: 0
     *           default: 0
     *         description: Number of roles to skip for pagination
     *       - in: query
     *         name: take
     *         schema:
     *           type: integer
     *           minimum: 1
     *           maximum: 100
     *           default: 20
     *         description: Number of roles to return
     *       - in: query
     *         name: includeSystem
     *         schema:
     *           type: boolean
     *         description: Filter by system roles (true), non-system roles (false), or all (undefined)
     *       - in: query
     *         name: searchTerm
     *         schema:
     *           type: string
     *         description: Search term to filter roles by name or description
     *     responses:
     *       200:
     *         description: Roles retrieved successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 status:
     *                   type: string
     *                   example: success
     *                 statusCode:
     *                   type: number
     *                   example: 200
     *                 message:
     *                   type: string
     *                   example: Roles retrieved successfully
     *                 data:
     *                   type: object
     *                   properties:
     *                     roles:
     *                       type: array
     *                       items:
     *                         type: object
     *                         properties:
     *                           id:
     *                             type: string
     *                             format: uuid
     *                           name:
     *                             type: string
     *                           description:
     *                             type: string
     *                           isSystem:
     *                             type: boolean
     *                           createdAt:
     *                             type: string
     *                             format: date-time
     *                           updatedAt:
     *                             type: string
     *                             format: date-time
     *                     total:
     *                       type: number
     *                     skip:
     *                       type: number
     *                     take:
     *                       type: number
     *       401:
     *         description: Authentication required
     *       403:
     *         description: Insufficient permissions
     *       500:
     *         description: Server error
     */
    this.router.get(
      '/',
      PermissionMiddleware.requirePermission(CommonPermissions.ROLE_READ),
      this.asyncHandler(this.rolesController.listRoles.bind(this.rolesController))
    );

    /**
     * @swagger
     * /rbac/roles/{id}:
     *   get:
     *     summary: Get role by ID
     *     description: Retrieve a specific role by its ID
     *     tags: [Roles]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *           format: uuid
     *         description: Role ID
     *     responses:
     *       200:
     *         description: Role retrieved successfully
     *       401:
     *         description: Authentication required
     *       403:
     *         description: Insufficient permissions
     *       404:
     *         description: Role not found
     *       500:
     *         description: Server error
     */
    this.router.get(
      '/:id',
      PermissionMiddleware.requirePermission(CommonPermissions.ROLE_READ),
      this.asyncHandler(this.rolesController.getRoleById.bind(this.rolesController))
    );

    /**
     * @swagger
     * /rbac/roles/{id}:
     *   put:
     *     summary: Update role
     *     description: Update an existing role (system roles cannot be modified)
     *     tags: [Roles]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *           format: uuid
     *         description: Role ID
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               name:
     *                 type: string
     *                 maxLength: 50
     *               description:
     *                 type: string
     *                 maxLength: 255
     *     responses:
     *       200:
     *         description: Role updated successfully
     *       400:
     *         description: Invalid role data
     *       401:
     *         description: Authentication required
     *       403:
     *         description: Insufficient permissions or system role
     *       404:
     *         description: Role not found
     *       500:
     *         description: Server error
     */
    this.router.put(
      '/:id',
      PermissionMiddleware.requirePermission(CommonPermissions.ROLE_UPDATE),
      this.asyncHandler(this.rolesController.updateRole.bind(this.rolesController))
    );

    /**
     * @swagger
     * /rbac/roles/{id}:
     *   delete:
     *     summary: Delete role
     *     description: Delete a role (system roles cannot be deleted)
     *     tags: [Roles]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *           format: uuid
     *         description: Role ID
     *     responses:
     *       200:
     *         description: Role deleted successfully
     *       401:
     *         description: Authentication required
     *       403:
     *         description: Insufficient permissions or system role
     *       404:
     *         description: Role not found
     *       500:
     *         description: Server error
     */
    this.router.delete(
      '/:id',
      PermissionMiddleware.requirePermission(CommonPermissions.ROLE_DELETE),
      this.asyncHandler(this.rolesController.deleteRole.bind(this.rolesController))
    );

    /**
     * @swagger
     * /rbac/roles/assign:
     *   post:
     *     summary: Assign role to user
     *     description: Assign a role to a specific user
     *     tags: [Roles]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - roleId
     *               - userId
     *             properties:
     *               roleId:
     *                 type: string
     *                 format: uuid
     *                 description: Role ID to assign
     *               userId:
     *                 type: string
     *                 format: uuid
     *                 description: User ID to assign role to
     *     responses:
     *       200:
     *         description: Role assigned to user successfully
     *       400:
     *         description: Invalid request data
     *       401:
     *         description: Authentication required
     *       403:
     *         description: Insufficient permissions
     *       404:
     *         description: Role or user not found
     *       500:
     *         description: Server error
     */
    this.router.post(
      '/assign',
      PermissionMiddleware.requirePermission(CommonPermissions.ROLE_ASSIGN),
      this.asyncHandler(this.rolesController.assignRoleToUser.bind(this.rolesController))
    );

    /**
     * @swagger
     * /rbac/roles/remove:
     *   post:
     *     summary: Remove role from user
     *     description: Remove a role from a specific user
     *     tags: [Roles]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - roleId
     *               - userId
     *             properties:
     *               roleId:
     *                 type: string
     *                 format: uuid
     *                 description: Role ID to remove
     *               userId:
     *                 type: string
     *                 format: uuid
     *                 description: User ID to remove role from
     *     responses:
     *       200:
     *         description: Role removed from user successfully
     *       400:
     *         description: Invalid request data
     *       401:
     *         description: Authentication required
     *       403:
     *         description: Insufficient permissions
     *       404:
     *         description: Role or user not found
     *       500:
     *         description: Server error
     */
    this.router.post(
      '/remove',
      PermissionMiddleware.requirePermission(CommonPermissions.ROLE_ASSIGN),
      this.asyncHandler(this.rolesController.removeRoleFromUser.bind(this.rolesController))
    );
  }

  private asyncHandler(fn: any) {
    return (req: any, res: any, next: any) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }

  public getRouter(): Router {
    return this.router;
  }
}

// Factory function to create routes with dependency injection
export function createRolesRoutes(rolesController: RolesController): Router {
  const rolesRoutes = new RolesRoutes(rolesController);
  return rolesRoutes.getRouter();
}
