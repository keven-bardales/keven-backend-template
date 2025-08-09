/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User authentication and token management
 */
import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { ValidationMiddleware } from '../../../../shared/application/middleware/validation.middleware';
import { AuthMiddleware } from '../../../../shared/application/middleware/auth.middleware';
import { RateLimitMiddleware } from '../../../../api/middleware/rate-limit.middleware';
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
    /**
     * @swagger
     * /auth/register:
     *   post:
     *     summary: Register new user
     *     description: Create a new user account with email and password
     *     tags: [Authentication]
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
     *                 description: User password (minimum 8 characters)
     *               firstName:
     *                 type: string
     *                 description: User first name
     *               lastName:
     *                 type: string
     *                 description: User last name
     *     responses:
     *       200:
     *         description: Registration successful
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
     *                   example: Registration successful
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
     *                     mustChangePassword:
     *                       type: boolean
     *                     createdAt:
     *                       type: string
     *                       format: date-time
     *       400:
     *         description: Invalid registration data
     *       409:
     *         description: User already exists
     *       500:
     *         description: Server error
     */
    this.router.post(
      '/register',
      RateLimitMiddleware.auth(),
      this.asyncHandler(this.authController.register.bind(this.authController))
    );

    /**
     * @swagger
     * /auth/login:
     *   post:
     *     summary: Authenticate user
     *     description: Login with email and password to receive access and refresh tokens
     *     tags: [Authentication]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - email
     *               - password
     *             properties:
     *               email:
     *                 type: string
     *                 format: email
     *                 description: User email address
     *               password:
     *                 type: string
     *                 format: password
     *                 description: User password
     *     responses:
     *       200:
     *         description: Successful authentication
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
     *                   example: Authentication successful
     *                 data:
     *                   type: object
     *                   properties:
     *                     accessToken:
     *                       type: string
     *                     refreshToken:
     *                       type: string
     *                     user:
     *                       type: object
     *                       properties:
     *                         id:
     *                           type: string
     *                           format: uuid
     *                         email:
     *                           type: string
     *                         firstName:
     *                           type: string
     *                         lastName:
     *                           type: string
     *       400:
     *         description: Invalid credentials format
     *       401:
     *         description: Authentication failed
     *       500:
     *         description: Server error
     */
    this.router.post(
      '/login',
      RateLimitMiddleware.auth(),
      ValidationMiddleware.validate(LoginDto.getSchema(), 'body'),
      this.asyncHandler(this.authController.login.bind(this.authController))
    );

    /**
     * @swagger
     * /auth/refresh:
     *   post:
     *     summary: Refresh authentication tokens
     *     description: Use refresh token to get new access and refresh tokens
     *     tags: [Authentication]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - refreshToken
     *             properties:
     *               refreshToken:
     *                 type: string
     *                 description: Valid refresh token
     *     responses:
     *       200:
     *         description: Tokens refreshed successfully
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
     *                   example: Tokens refreshed successfully
     *                 data:
     *                   type: object
     *                   properties:
     *                     accessToken:
     *                       type: string
     *                     refreshToken:
     *                       type: string
     *       400:
     *         description: Invalid refresh token format
     *       401:
     *         description: Invalid or expired refresh token
     *       500:
     *         description: Server error
     */
    this.router.post(
      '/refresh',
      RateLimitMiddleware.auth(),
      ValidationMiddleware.validate(RefreshTokenDto.getSchema(), 'body'),
      this.asyncHandler(this.authController.refreshToken.bind(this.authController))
    );

    // Protected routes (require authentication)
    /**
     * @swagger
     * /auth/logout:
     *   post:
     *     summary: Logout current user
     *     description: Invalidate the current session's tokens
     *     tags: [Authentication]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Logout successful
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
     *                   example: Logged out successfully
     *                 data:
     *                   type: null
     *       401:
     *         description: Unauthorized
     *       500:
     *         description: Server error
     */
    this.router.post(
      '/logout',
      // AuthMiddleware.authenticate(), // TODO: Uncomment when JWT service is fully integrated
      this.asyncHandler(this.authController.logout.bind(this.authController))
    );

    /**
     * @swagger
     * /auth/logout-all:
     *   post:
     *     summary: Logout from all devices
     *     description: Invalidate all active sessions and tokens for the current user
     *     tags: [Authentication]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: All sessions terminated successfully
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
     *                   example: Logged out from all devices
     *                 data:
     *                   type: null
     *       401:
     *         description: Unauthorized
     *       500:
     *         description: Server error
     */
    this.router.post(
      '/logout-all',
      // AuthMiddleware.authenticate(), // TODO: Uncomment when JWT service is fully integrated
      this.asyncHandler(this.authController.logoutAll.bind(this.authController))
    );

    /**
     * @swagger
     * /auth/profile:
     *   get:
     *     summary: Get current user profile
     *     description: Returns the profile of the currently authenticated user
     *     tags: [Authentication]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Profile retrieved successfully
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
     *                   example: Profile retrieved successfully
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
     *       401:
     *         description: Unauthorized
     *       404:
     *         description: Profile not found
     *       500:
     *         description: Server error
     */
    this.router.get(
      '/profile',
      // AuthMiddleware.authenticate(), // TODO: Uncomment when JWT service is fully integrated
      this.asyncHandler(this.authController.getProfile.bind(this.authController))
    );

    /**
     * @swagger
     * /auth/validate:
     *   post:
     *     summary: Validate authentication token
     *     description: Validates if the current token is valid and active
     *     tags: [Authentication]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Token is valid
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
     *                   example: Token is valid
     *                 data:
     *                   type: object
     *                   properties:
     *                     valid:
     *                       type: boolean
     *                       example: true
     *                     userId:
     *                       type: string
     *                       format: uuid
     *       401:
     *         description: Invalid or expired token
     *       500:
     *         description: Server error
     */
    this.router.post(
      '/validate',
      // AuthMiddleware.authenticate(), // TODO: Uncomment when JWT service is fully integrated
      this.asyncHandler(this.authController.validateToken.bind(this.authController))
    );

    /**
     * @swagger
     * /auth/health:
     *   get:
     *     summary: Auth service health check
     *     description: Check if the authentication service is functioning properly
     *     tags: [Authentication]
     *     responses:
     *       200:
     *         description: Auth service is healthy
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                   example: true
     *                 message:
     *                   type: string
     *                   example: Auth service is healthy
     *                 timestamp:
     *                   type: string
     *                   format: date-time
     */
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
