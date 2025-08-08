import { Router } from 'express';
import { createUsersRoutes } from '../../modules/users/infrastructure/routes/users.routes';
import { UsersController } from '../../modules/users/infrastructure/controllers/users.controller';
import { createAuthRoutes } from '../../modules/auth/infrastructure/routes/auth.routes';
import { AuthController } from '../../modules/auth/infrastructure/controllers/auth.controller';
import { globalContainer } from '../../shared/application/dependencies/register-dependencies';
import { TOKENS } from '../../shared/application/dependencies/tokens';
import { ApiResponse } from '../../shared/domain/wrappers/api-response.wrapper';

export class ApiRoutes {
  private readonly router: Router;

  constructor() {
    this.router = Router();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    // Health check endpoint
    this.router.get('/health', (req, res) => {
      const response = ApiResponse.success(
        {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          version: process.env.npm_package_version || '1.0.0',
          environment: process.env.NODE_ENV || 'development',
        },
        'Service is healthy'
      );

      res.status(response.statusCode).json(response.toJSON());
    });

    // API version info
    this.router.get('/', (req, res) => {
      const response = ApiResponse.success(
        {
          name: 'Keven Backend Template',
          version: process.env.npm_package_version || '1.0.0',
          description: 'Clean Architecture Node.js Backend Template',
          documentation: '/api/docs', // TODO: Add swagger documentation
          endpoints: {
            health: '/api/health',
            users: '/api/users',
            auth: '/api/auth',
          },
        },
        'API information retrieved successfully'
      );

      res.status(response.statusCode).json(response.toJSON());
    });

    // Module routes
    this.setupModuleRoutes();
  }

  private setupModuleRoutes(): void {
    try {
      // Users module routes
      const usersController = globalContainer.resolve<UsersController>(TOKENS.USERS_CONTROLLER);
      this.router.use('/users', createUsersRoutes(usersController));

      // Auth module routes
      const authController = globalContainer.resolve<AuthController>(TOKENS.AUTH_CONTROLLER);
      this.router.use('/auth', createAuthRoutes(authController));
    } catch (error) {
      console.error('Error setting up module routes:', error);

      // Fallback route for development
      this.router.use('*', (req, res) => {
        const response = ApiResponse.notFound('Endpoint not found or not yet implemented');
        res.status(response.statusCode).json(response.toJSON());
      });
    }
  }

  public getRouter(): Router {
    return this.router;
  }
}

export function createApiRoutes(): Router {
  const apiRoutes = new ApiRoutes();
  return apiRoutes.getRouter();
}
