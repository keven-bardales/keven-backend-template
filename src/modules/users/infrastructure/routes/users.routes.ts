/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management operations
 */
import { Router } from 'express';
import { UsersController } from '../controllers/users.controller';
import { ValidationMiddleware } from '../../../../shared/application/middleware/validation.middleware';
import { AuthMiddleware } from '../../../../shared/application/middleware/auth.middleware';
import { RateLimitMiddleware } from '../../../../api/middleware/rate-limit.middleware';
import { CreateUserDto } from '../../application/dto/create-user.dto';
import { UpdateUserDto } from '../../application/dto/update-user.dto';
import { GetUserByIdDto } from '../../application/dto/get-user-by-id.dto';

export class UsersRoutes {
  private readonly router: Router;

  constructor(private readonly usersController: UsersController) {
    this.router = Router();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    // Apply rate limiting to all user routes
    this.router.use(RateLimitMiddleware.users());

    // Public routes (no authentication required)
    /**
     * @swagger
     * /users:
     *   post:
     *     summary: Create a new user
     *     tags: [Users]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - email
     *               - password
     *               - firstName
     *               - lastName
     *             properties:
     *               email:
     *                 type: string
     *                 format: email
     *                 description: User email address
     *               password:
     *                 type: string
     *                 format: password
     *                 minLength: 8
     *                 description: User password
     *               firstName:
     *                 type: string
     *                 description: User's first name
     *               lastName:
     *                 type: string
     *                 description: User's last name
     *               phoneNumber:
     *                 type: string
     *                 description: User's phone number (optional)
     *     responses:
     *       201:
     *         description: User created successfully
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
     *                   example: User created successfully
     *                 data:
     *                   type: object
     *                   properties:
     *                     id:
     *                       type: string
     *                       format: uuid
     *                     email:
     *                       type: string
     *                     firstName:
     *                       type: string
     *                     lastName:
     *                       type: string
     *       400:
     *         description: Invalid request data
     *       409:
     *         description: User with this email already exists
     *       500:
     *         description: Server error
     */
    this.router.post(
      '/',
      ValidationMiddleware.validate(CreateUserDto.getSchema(), 'body'),
      this.asyncHandler(this.usersController.createUser.bind(this.usersController))
    );

    // Protected routes (authentication required)
    /**
     * @swagger
     * /users:
     *   get:
     *     summary: Get all users
     *     tags: [Users]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: A list of users
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
     *                   example: Users retrieved successfully
     *                 data:
     *                   type: array
     *                   items:
     *                     type: object
     *                     properties:
     *                       id:
     *                         type: string
     *                         format: uuid
     *                       email:
     *                         type: string
     *                       firstName:
     *                         type: string
     *                       lastName:
     *                         type: string
     *                       isActive:
     *                         type: boolean
     *       401:
     *         description: Unauthorized
     *       500:
     *         description: Server error
     */
    this.router.get(
      '/',
      // AuthMiddleware.authenticate(), // TODO: Uncomment when JWT service is implemented
      this.asyncHandler(this.usersController.getUsers.bind(this.usersController))
    );

    /**
     * @swagger
     * /users/me:
     *   get:
     *     summary: Get current user profile
     *     tags: [Users]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Current user profile retrieved successfully
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
     *                   example: Current user retrieved successfully
     *                 data:
     *                   type: object
     *                   properties:
     *                     id:
     *                       type: string
     *                       format: uuid
     *                     email:
     *                       type: string
     *                     firstName:
     *                       type: string
     *                     lastName:
     *                       type: string
     *                     isActive:
     *                       type: boolean
     *                     createdAt:
     *                       type: string
     *                       format: date-time
     *                     updatedAt:
     *                       type: string
     *                       format: date-time
     *       401:
     *         description: Unauthorized
     *       500:
     *         description: Server error
     */
    this.router.get(
      '/me',
      // AuthMiddleware.authenticate(), // TODO: Uncomment when JWT service is implemented
      this.asyncHandler(this.usersController.getCurrentUser.bind(this.usersController))
    );

    /**
     * @swagger
     * /users/{id}:
     *   get:
     *     summary: Get a user by ID
     *     tags: [Users]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         schema:
     *           type: string
     *           format: uuid
     *         required: true
     *         description: UUID of the user
     *     responses:
     *       200:
     *         description: User data retrieved successfully
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
     *                   example: User retrieved successfully
     *                 data:
     *                   type: object
     *                   properties:
     *                     id:
     *                       type: string
     *                       format: uuid
     *                     email:
     *                       type: string
     *                     firstName:
     *                       type: string
     *                     lastName:
     *                       type: string
     *                     isActive:
     *                       type: boolean
     *       400:
     *         description: Invalid user ID
     *       401:
     *         description: Unauthorized
     *       404:
     *         description: User not found
     *       500:
     *         description: Server error
     */
    this.router.get(
      '/:id',
      ValidationMiddleware.validate(GetUserByIdDto.getSchema(), 'params'),
      // AuthMiddleware.authenticate(), // TODO: Uncomment when JWT service is implemented
      this.asyncHandler(this.usersController.getUserById.bind(this.usersController))
    );

    /**
     * @swagger
     * /users/{id}:
     *   put:
     *     summary: Update a user
     *     tags: [Users]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         schema:
     *           type: string
     *           format: uuid
     *         required: true
     *         description: UUID of the user to update
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               email:
     *                 type: string
     *                 format: email
     *                 description: Updated email address
     *               firstName:
     *                 type: string
     *                 description: Updated first name
     *               lastName:
     *                 type: string
     *                 description: Updated last name
     *     responses:
     *       200:
     *         description: User updated successfully
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
     *                   example: User updated successfully
     *                 data:
     *                   type: object
     *                   properties:
     *                     id:
     *                       type: string
     *                       format: uuid
     *                     email:
     *                       type: string
     *                     firstName:
     *                       type: string
     *                     lastName:
     *                       type: string
     *       400:
     *         description: Invalid request data
     *       401:
     *         description: Unauthorized
     *       404:
     *         description: User not found
     *       500:
     *         description: Server error
     */
    this.router.put(
      '/:id',
      ValidationMiddleware.validateMultiple([
        { schema: GetUserByIdDto.getSchema(), target: 'params' },
        { schema: UpdateUserDto.getSchema(), target: 'body' },
      ]),
      // AuthMiddleware.authenticate(), // TODO: Uncomment when JWT service is implemented
      // AuthMiddleware.authorize(['users:update']), // TODO: Add when RBAC is implemented
      this.asyncHandler(this.usersController.updateUser.bind(this.usersController))
    );

    /**
     * @swagger
     * /users/{id}:
     *   delete:
     *     summary: Delete a user
     *     tags: [Users]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         schema:
     *           type: string
     *           format: uuid
     *         required: true
     *         description: UUID of the user to delete
     *     responses:
     *       200:
     *         description: User deleted successfully
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
     *                   example: User deleted successfully
     *                 data:
     *                   type: null
     *       400:
     *         description: Invalid user ID
     *       401:
     *         description: Unauthorized
     *       403:
     *         description: Insufficient permissions
     *       404:
     *         description: User not found
     *       500:
     *         description: Server error
     */
    this.router.delete(
      '/:id',
      ValidationMiddleware.validate(GetUserByIdDto.getSchema(), 'params'),
      // AuthMiddleware.authenticate(), // TODO: Uncomment when JWT service is implemented
      // AuthMiddleware.authorize(['users:delete']), // TODO: Add when RBAC is implemented
      this.asyncHandler(this.usersController.deleteUser.bind(this.usersController))
    );

    // Admin routes (require special permissions)
    /**
     * @swagger
     * /users/{id}/activate:
     *   patch:
     *     summary: Activate a user account
     *     description: Reactivate a previously deactivated user account (admin only)
     *     tags: [Users]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         schema:
     *           type: string
     *           format: uuid
     *         required: true
     *         description: UUID of the user to activate
     *     responses:
     *       200:
     *         description: User activated successfully
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
     *                   example: User activated successfully
     *                 data:
     *                   type: object
     *                   properties:
     *                     id:
     *                       type: string
     *                       format: uuid
     *                     isActive:
     *                       type: boolean
     *                       example: true
     *       400:
     *         description: Invalid user ID
     *       401:
     *         description: Unauthorized
     *       403:
     *         description: Insufficient permissions (admin required)
     *       404:
     *         description: User not found
     *       500:
     *         description: Server error
     */
    this.router.patch(
      '/:id/activate',
      ValidationMiddleware.validate(GetUserByIdDto.getSchema(), 'params'),
      // AuthMiddleware.authenticate(), // TODO: Uncomment when JWT service is implemented
      // AuthMiddleware.authorize(['users:activate']), // TODO: Add when RBAC is implemented
      this.asyncHandler(this.usersController.activateUser.bind(this.usersController))
    );

    /**
     * @swagger
     * /users/{id}/deactivate:
     *   patch:
     *     summary: Deactivate a user account
     *     description: Temporarily deactivate a user account without deletion (admin only)
     *     tags: [Users]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         schema:
     *           type: string
     *           format: uuid
     *         required: true
     *         description: UUID of the user to deactivate
     *     responses:
     *       200:
     *         description: User deactivated successfully
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
     *                   example: User deactivated successfully
     *                 data:
     *                   type: object
     *                   properties:
     *                     id:
     *                       type: string
     *                       format: uuid
     *                     isActive:
     *                       type: boolean
     *                       example: false
     *       400:
     *         description: Invalid user ID
     *       401:
     *         description: Unauthorized
     *       403:
     *         description: Insufficient permissions (admin required)
     *       404:
     *         description: User not found
     *       500:
     *         description: Server error
     */
    this.router.patch(
      '/:id/deactivate',
      ValidationMiddleware.validate(GetUserByIdDto.getSchema(), 'params'),
      // AuthMiddleware.authenticate(), // TODO: Uncomment when JWT service is implemented
      // AuthMiddleware.authorize(['users:deactivate']), // TODO: Add when RBAC is implemented
      this.asyncHandler(this.usersController.deactivateUser.bind(this.usersController))
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

// Factory function to create routes with dependency injection
export function createUsersRoutes(usersController: UsersController): Router {
  const usersRoutes = new UsersRoutes(usersController);
  return usersRoutes.getRouter();
}
