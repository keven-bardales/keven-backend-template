/**
 * @swagger
 * tags:
 *   name: Modules
 *   description: System modules management operations
 */
import { Router } from 'express';
import { ModulesController } from '../controllers/modules.controller';
import { ValidationMiddleware } from '../../../../shared/application/middleware/validation.middleware';
import { AuthMiddleware } from '../../../../shared/application/middleware/auth.middleware';
import {
  PermissionMiddleware,
  CommonPermissions,
} from '../../../../shared/application/middleware/permission.middleware';
import { RateLimitMiddleware } from '../../../../api/middleware/rate-limit.middleware';
import { CreateModuleDto } from '../../application/dto/create-module.dto';
import { UpdateModuleDto } from '../../application/dto/update-module.dto';
import { GetModulesDto } from '../../application/dto/get-modules.dto';
import { GetUserByIdDto } from '../../../users/application/dto/get-user-by-id.dto'; // For ID validation

export class ModulesRoutes {
  private readonly router: Router;

  constructor(private readonly modulesController: ModulesController) {
    this.router = Router();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    // Apply rate limiting to all module routes
    this.router.use(RateLimitMiddleware.rbac());

    /**
     * @swagger
     * /rbac/modules:
     *   get:
     *     summary: Get all modules with pagination and filtering
     *     description: Retrieve a paginated list of system modules with optional filtering and search
     *     tags: [Modules]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: query
     *         name: page
     *         schema:
     *           type: integer
     *           minimum: 1
     *           default: 1
     *         description: Page number for pagination
     *       - in: query
     *         name: limit
     *         schema:
     *           type: integer
     *           minimum: 1
     *           maximum: 100
     *           default: 10
     *         description: Number of items per page
     *       - in: query
     *         name: search
     *         schema:
     *           type: string
     *         description: Search term for module name or description
     *       - in: query
     *         name: isActive
     *         schema:
     *           type: boolean
     *         description: Filter by active/inactive status
     *       - in: query
     *         name: sortBy
     *         schema:
     *           type: string
     *           enum: [name, createdAt, updatedAt]
     *           default: createdAt
     *         description: Field to sort by
     *       - in: query
     *         name: sortOrder
     *         schema:
     *           type: string
     *           enum: [asc, desc]
     *           default: desc
     *         description: Sort order
     *     responses:
     *       200:
     *         description: Modules retrieved successfully
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
     *                   example: Modules retrieved successfully
     *                 data:
     *                   type: object
     *                   properties:
     *                     modules:
     *                       type: array
     *                       items:
     *                         $ref: '#/components/schemas/Module'
     *                     total:
     *                       type: number
     *                       example: 50
     *                     page:
     *                       type: number
     *                       example: 1
     *                     limit:
     *                       type: number
     *                       example: 10
     *                     totalPages:
     *                       type: number
     *                       example: 5
     *                     hasNextPage:
     *                       type: boolean
     *                       example: true
     *                     hasPreviousPage:
     *                       type: boolean
     *                       example: false
     *       401:
     *         description: Unauthorized
     *       500:
     *         description: Server error
     */
    this.router.get(
      '/',
      ValidationMiddleware.validate(GetModulesDto.getSchema(), 'query'),
      AuthMiddleware.authenticate(),
      PermissionMiddleware.requirePermission(CommonPermissions.MODULE_LIST),
      this.asyncHandler(this.modulesController.getModules.bind(this.modulesController))
    );

    /**
     * @swagger
     * /rbac/modules/active:
     *   get:
     *     summary: Get active modules only
     *     description: Retrieve all active system modules
     *     tags: [Modules]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Active modules retrieved successfully
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
     *                   example: Active modules retrieved successfully
     *                 data:
     *                   type: array
     *                   items:
     *                     $ref: '#/components/schemas/Module'
     *       401:
     *         description: Unauthorized
     *       500:
     *         description: Server error
     */
    this.router.get(
      '/active',
      AuthMiddleware.authenticate(),
      PermissionMiddleware.requirePermission(CommonPermissions.MODULE_READ),
      this.asyncHandler(this.modulesController.getActiveModules.bind(this.modulesController))
    );

    /**
     * @swagger
     * /rbac/modules:
     *   post:
     *     summary: Create a new module
     *     description: Create a new system module
     *     tags: [Modules]
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
     *                 minLength: 1
     *                 maxLength: 50
     *                 description: Module name (must be unique)
     *               description:
     *                 type: string
     *                 maxLength: 255
     *                 description: Module description
     *               isActive:
     *                 type: boolean
     *                 default: true
     *                 description: Whether the module is active
     *     responses:
     *       201:
     *         description: Module created successfully
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
     *                   example: 201
     *                 message:
     *                   type: string
     *                   example: Module created successfully
     *                 data:
     *                   $ref: '#/components/schemas/Module'
     *       400:
     *         description: Invalid request data
     *       401:
     *         description: Unauthorized
     *       409:
     *         description: Module with this name already exists
     *       500:
     *         description: Server error
     */
    this.router.post(
      '/',
      ValidationMiddleware.validate(CreateModuleDto.getSchema(), 'body'),
      AuthMiddleware.authenticate(),
      PermissionMiddleware.requirePermission(CommonPermissions.MODULE_CREATE),
      this.asyncHandler(this.modulesController.createModule.bind(this.modulesController))
    );

    /**
     * @swagger
     * /rbac/modules/{id}:
     *   get:
     *     summary: Get module by ID
     *     description: Retrieve a specific module by its ID
     *     tags: [Modules]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         schema:
     *           type: string
     *           format: uuid
     *         required: true
     *         description: Module ID
     *     responses:
     *       200:
     *         description: Module retrieved successfully
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
     *                   example: Module retrieved successfully
     *                 data:
     *                   $ref: '#/components/schemas/Module'
     *       400:
     *         description: Invalid module ID
     *       401:
     *         description: Unauthorized
     *       404:
     *         description: Module not found
     *       500:
     *         description: Server error
     */
    this.router.get(
      '/:id',
      ValidationMiddleware.validate(GetUserByIdDto.getSchema(), 'params'), // Reuse for UUID validation
      AuthMiddleware.authenticate(),
      PermissionMiddleware.requirePermission(CommonPermissions.MODULE_READ),
      this.asyncHandler(this.modulesController.getModuleById.bind(this.modulesController))
    );

    /**
     * @swagger
     * /rbac/modules/{id}:
     *   put:
     *     summary: Update a module
     *     description: Update an existing module
     *     tags: [Modules]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         schema:
     *           type: string
     *           format: uuid
     *         required: true
     *         description: Module ID
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               name:
     *                 type: string
     *                 minLength: 1
     *                 maxLength: 50
     *                 description: Module name (must be unique)
     *               description:
     *                 type: string
     *                 maxLength: 255
     *                 nullable: true
     *                 description: Module description
     *               isActive:
     *                 type: boolean
     *                 description: Whether the module is active
     *     responses:
     *       200:
     *         description: Module updated successfully
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
     *                   example: Module updated successfully
     *                 data:
     *                   $ref: '#/components/schemas/Module'
     *       400:
     *         description: Invalid request data
     *       401:
     *         description: Unauthorized
     *       404:
     *         description: Module not found
     *       409:
     *         description: Module with this name already exists
     *       500:
     *         description: Server error
     */
    this.router.put(
      '/:id',
      ValidationMiddleware.validateMultiple([
        { schema: GetUserByIdDto.getSchema(), target: 'params' },
        { schema: UpdateModuleDto.getSchema(), target: 'body' },
      ]),
      AuthMiddleware.authenticate(),
      PermissionMiddleware.requirePermission(CommonPermissions.MODULE_UPDATE),
      this.asyncHandler(this.modulesController.updateModule.bind(this.modulesController))
    );

    /**
     * @swagger
     * /rbac/modules/{id}:
     *   delete:
     *     summary: Delete a module
     *     description: Delete a module (this may affect related permissions)
     *     tags: [Modules]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         schema:
     *           type: string
     *           format: uuid
     *         required: true
     *         description: Module ID
     *     responses:
     *       200:
     *         description: Module deleted successfully
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
     *                   example: Module deleted successfully
     *                 data:
     *                   type: null
     *       400:
     *         description: Invalid module ID
     *       401:
     *         description: Unauthorized
     *       403:
     *         description: Insufficient permissions
     *       404:
     *         description: Module not found
     *       500:
     *         description: Server error
     */
    this.router.delete(
      '/:id',
      ValidationMiddleware.validate(GetUserByIdDto.getSchema(), 'params'),
      AuthMiddleware.authenticate(),
      PermissionMiddleware.requirePermission(CommonPermissions.MODULE_DELETE),
      this.asyncHandler(this.modulesController.deleteModule.bind(this.modulesController))
    );

    /**
     * @swagger
     * /rbac/modules/{id}/activate:
     *   patch:
     *     summary: Activate a module
     *     description: Activate a module that was previously deactivated
     *     tags: [Modules]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         schema:
     *           type: string
     *           format: uuid
     *         required: true
     *         description: Module ID
     *     responses:
     *       200:
     *         description: Module activated successfully
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
     *                   example: Module activated successfully
     *                 data:
     *                   $ref: '#/components/schemas/Module'
     *       400:
     *         description: Invalid module ID
     *       401:
     *         description: Unauthorized
     *       403:
     *         description: Insufficient permissions
     *       404:
     *         description: Module not found
     *       500:
     *         description: Server error
     */
    this.router.patch(
      '/:id/activate',
      ValidationMiddleware.validate(GetUserByIdDto.getSchema(), 'params'),
      AuthMiddleware.authenticate(),
      PermissionMiddleware.requirePermission(CommonPermissions.MODULE_UPDATE),
      this.asyncHandler(this.modulesController.activateModule.bind(this.modulesController))
    );

    /**
     * @swagger
     * /rbac/modules/{id}/deactivate:
     *   patch:
     *     summary: Deactivate a module
     *     description: Deactivate a module without deleting it
     *     tags: [Modules]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         schema:
     *           type: string
     *           format: uuid
     *         required: true
     *         description: Module ID
     *     responses:
     *       200:
     *         description: Module deactivated successfully
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
     *                   example: Module deactivated successfully
     *                 data:
     *                   $ref: '#/components/schemas/Module'
     *       400:
     *         description: Invalid module ID
     *       401:
     *         description: Unauthorized
     *       403:
     *         description: Insufficient permissions
     *       404:
     *         description: Module not found
     *       500:
     *         description: Server error
     */
    this.router.patch(
      '/:id/deactivate',
      ValidationMiddleware.validate(GetUserByIdDto.getSchema(), 'params'),
      AuthMiddleware.authenticate(),
      PermissionMiddleware.requirePermission(CommonPermissions.MODULE_UPDATE),
      this.asyncHandler(this.modulesController.deactivateModule.bind(this.modulesController))
    );
  }

  // Async error handler wrapper
  private asyncHandler(fn: any) {
    return (req: any, res: any, next: any) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }

  public getRouter(): Router {
    return this.router;
  }
}

/**
 * @swagger
 * components:
 *   schemas:
 *     Module:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Module unique identifier
 *         name:
 *           type: string
 *           description: Module name
 *         description:
 *           type: string
 *           nullable: true
 *           description: Module description
 *         isActive:
 *           type: boolean
 *           description: Whether the module is active
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Module creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Module last update timestamp
 *       required:
 *         - id
 *         - name
 *         - isActive
 *         - createdAt
 *         - updatedAt
 */

// Factory function to create routes with dependency injection
export function createModulesRoutes(modulesController: ModulesController): Router {
  const modulesRoutes = new ModulesRoutes(modulesController);
  return modulesRoutes.getRouter();
}
