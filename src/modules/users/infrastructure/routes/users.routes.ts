import { Router } from 'express';
import { UsersController } from '../controllers/users.controller';
import { ValidationMiddleware } from '../../../../shared/application/middleware/validation.middleware';
import { AuthMiddleware } from '../../../../shared/application/middleware/auth.middleware';
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
    // Public routes (no authentication required)
    this.router.post(
      '/',
      ValidationMiddleware.validate(CreateUserDto.getSchema(), 'body'),
      this.asyncHandler(this.usersController.createUser.bind(this.usersController))
    );

    // Protected routes (authentication required)
    this.router.get(
      '/',
      // AuthMiddleware.authenticate(), // TODO: Uncomment when JWT service is implemented
      this.asyncHandler(this.usersController.getUsers.bind(this.usersController))
    );

    this.router.get(
      '/me',
      // AuthMiddleware.authenticate(), // TODO: Uncomment when JWT service is implemented
      this.asyncHandler(this.usersController.getCurrentUser.bind(this.usersController))
    );

    this.router.get(
      '/:id',
      ValidationMiddleware.validate(GetUserByIdDto.getSchema(), 'params'),
      // AuthMiddleware.authenticate(), // TODO: Uncomment when JWT service is implemented
      this.asyncHandler(this.usersController.getUserById.bind(this.usersController))
    );

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

    this.router.delete(
      '/:id',
      ValidationMiddleware.validate(GetUserByIdDto.getSchema(), 'params'),
      // AuthMiddleware.authenticate(), // TODO: Uncomment when JWT service is implemented
      // AuthMiddleware.authorize(['users:delete']), // TODO: Add when RBAC is implemented
      this.asyncHandler(this.usersController.deleteUser.bind(this.usersController))
    );

    // Admin routes (require special permissions)
    this.router.patch(
      '/:id/activate',
      ValidationMiddleware.validate(GetUserByIdDto.getSchema(), 'params'),
      // AuthMiddleware.authenticate(), // TODO: Uncomment when JWT service is implemented
      // AuthMiddleware.authorize(['users:activate']), // TODO: Add when RBAC is implemented
      this.asyncHandler(this.usersController.activateUser.bind(this.usersController))
    );

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
