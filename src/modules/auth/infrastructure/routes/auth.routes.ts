import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { ValidationMiddleware } from '../../../../shared/application/middleware/validation.middleware';
import { AuthMiddleware } from '../../../../shared/application/middleware/auth.middleware';
import { LoginDto } from '../../application/dto/login.dto';
import { RefreshTokenDto } from '../../application/dto/refresh-token.dto';

export class AuthRoutes {
  private readonly router: Router;

  constructor(private readonly authController: AuthController) {
    this.router = Router();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    // Public authentication routes
    this.router.post(
      '/login',
      ValidationMiddleware.validate(LoginDto.getSchema(), 'body'),
      this.asyncHandler(this.authController.login.bind(this.authController))
    );

    this.router.post(
      '/refresh',
      ValidationMiddleware.validate(RefreshTokenDto.getSchema(), 'body'),
      this.asyncHandler(this.authController.refreshToken.bind(this.authController))
    );

    // Protected routes (require authentication)
    this.router.post(
      '/logout',
      // AuthMiddleware.authenticate(), // TODO: Uncomment when JWT service is fully integrated
      this.asyncHandler(this.authController.logout.bind(this.authController))
    );

    this.router.post(
      '/logout-all',
      // AuthMiddleware.authenticate(), // TODO: Uncomment when JWT service is fully integrated
      this.asyncHandler(this.authController.logoutAll.bind(this.authController))
    );

    this.router.get(
      '/profile',
      // AuthMiddleware.authenticate(), // TODO: Uncomment when JWT service is fully integrated
      this.asyncHandler(this.authController.getProfile.bind(this.authController))
    );

    this.router.post(
      '/validate',
      // AuthMiddleware.authenticate(), // TODO: Uncomment when JWT service is fully integrated
      this.asyncHandler(this.authController.validateToken.bind(this.authController))
    );

    // Health check for auth service
    this.router.get('/health', (req, res) => {
      res.status(200).json({
        success: true,
        message: 'Auth service is healthy',
        timestamp: new Date().toISOString(),
      });
    });
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
export function createAuthRoutes(authController: AuthController): Router {
  const authRoutes = new AuthRoutes(authController);
  return authRoutes.getRouter();
}
