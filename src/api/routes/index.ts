/**
 * @swagger
 * tags:
 *   name: Health
 *   description: Health check and API information
 */
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
    /**
     * @swagger
     * /health:
     *   get:
     *     summary: Health check endpoint
     *     description: Returns the health status of the service
     *     tags: [Health]
     *     responses:
     *       200:
     *         description: Service is healthy
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
     *                   example: Service is healthy
     *                 data:
     *                   type: object
     *                   properties:
     *                     status:
     *                       type: string
     *                       example: healthy
     *                     timestamp:
     *                       type: string
     *                       format: date-time
     *                     version:
     *                       type: string
     *                       example: 1.0.0
     *                     environment:
     *                       type: string
     *                       example: development
     */
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

    /**
     * @swagger
     * /:
     *   get:
     *     summary: API information
     *     description: Returns information about the API
     *     tags: [Health]
     *     responses:
     *       200:
     *         description: API information retrieved successfully
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
     *                   example: API information retrieved successfully
     *                 data:
     *                   type: object
     *                   properties:
     *                     name:
     *                       type: string
     *                       example: Keven Backend Template
     *                     version:
     *                       type: string
     *                       example: 1.0.0
     *                     description:
     *                       type: string
     *                       example: Clean Architecture Node.js Backend Template
     *                     documentation:
     *                       type: string
     *                       example: /api/docs
     *                     endpoints:
     *                       type: object
     *                       properties:
     *                         health:
     *                           type: string
     *                           example: /api/health
     *                         users:
     *                           type: string
     *                           example: /api/users
     *                         auth:
     *                           type: string
     *                           example: /api/auth
     */
    this.router.get('/', (req, res) => {
      const response = ApiResponse.success(
        {
          name: 'Keven Backend Template',
          version: process.env.npm_package_version || '1.0.0',
          description: 'Clean Architecture Node.js Backend Template',
          documentation: '/api/docs',
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
      // this.router.use('*', (req, res) => {
      //   const response = ApiResponse.notFound('Endpoint not found or not yet implemented');
      //   res.status(response.statusCode).json(response.toJSON());
      // });
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
