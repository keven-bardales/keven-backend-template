import { Request, Response, NextFunction } from 'express';
import { LoginUseCase } from '../../domain/use-cases/login.use-case';
import { RefreshTokenUseCase } from '../../domain/use-cases/refresh-token.use-case';
import { LogoutUseCase } from '../../domain/use-cases/logout.use-case';
import { LoginDto } from '../../application/dto/login.dto';
import { RefreshTokenDto } from '../../application/dto/refresh-token.dto';
import { AuthResponseDto, RefreshTokenResponseDto } from '../../application/dto/auth-response.dto';
import { ApiResponse } from '../../../../shared/domain/wrappers/api-response.wrapper';
import { AuthenticatedRequest } from '../../../../shared/application/middleware/auth.middleware';

export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly logoutUseCase: LogoutUseCase
  ) {}

  public async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const loginDto = new LoginDto(req.body);

      const result = await this.loginUseCase.execute({
        email: loginDto.email,
        password: loginDto.password,
        deviceInfo: loginDto.deviceInfo,
        ipAddress: this.getClientIp(req),
        userAgent: req.headers['user-agent'],
      });

      // Create response DTO
      const authResponse = AuthResponseDto.fromLoginResult(
        {
          id: result.user.id,
          email: { getValue: () => result.user.email } as any,
          firstName: result.user.firstName,
          lastName: result.user.lastName,
          getFullName: () => `${result.user.firstName} ${result.user.lastName}`,
          mustChangePassword: result.user.mustChangePassword,
          isActive: true,
        } as any,
        result.result
      );

      const response = ApiResponse.success(authResponse.toJSON(), 'Login successful');
      res.status(response.statusCode).json(response.toJSON());
    } catch (error) {
      next(error);
    }
  }

  public async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshTokenDto = new RefreshTokenDto(req.body);

      const result = await this.refreshTokenUseCase.execute({
        refreshToken: refreshTokenDto.refreshToken,
        deviceInfo: refreshTokenDto.deviceInfo,
        ipAddress: this.getClientIp(req),
      });

      const refreshResponse = new RefreshTokenResponseDto({
        accessTokenJwt: result.accessToken,
        refreshTokenJwt: result.refreshToken,
        expiresIn: result.expiresIn,
      });

      const response = ApiResponse.success(
        refreshResponse.toJSON(),
        'Token refreshed successfully'
      );
      res.status(response.statusCode).json(response.toJSON());
    } catch (error) {
      next(error);
    }
  }

  public async logout(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const accessToken = this.extractToken(req);
      const { refreshToken, logoutAllSessions } = req.body || {};

      const result = await this.logoutUseCase.execute({
        accessToken: accessToken || undefined,
        refreshToken,
        sessionId: req.user?.sessionId || undefined,
        logoutAllSessions: logoutAllSessions === true,
      });

      if (result.success) {
        const response = ApiResponse.success(null, result.message);
        res.status(response.statusCode).json(response.toJSON());
      } else {
        const response = ApiResponse.internalError(result.message);
        res.status(response.statusCode).json(response.toJSON());
      }
    } catch (error) {
      next(error);
    }
  }

  public async logoutAll(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const accessToken = this.extractToken(req);

      const result = await this.logoutUseCase.execute({
        accessToken: accessToken || undefined,
        logoutAllSessions: true,
      });

      if (result.success) {
        const response = ApiResponse.success(null, result.message);
        res.status(response.statusCode).json(response.toJSON());
      } else {
        const response = ApiResponse.internalError(result.message);
        res.status(response.statusCode).json(response.toJSON());
      }
    } catch (error) {
      next(error);
    }
  }

  public async getProfile(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        const response = ApiResponse.unauthorized('User not authenticated');
        res.status(response.statusCode).json(response.toJSON());
        return;
      }

      const response = ApiResponse.success(
        {
          id: req.user.id,
          email: req.user.email,
          roles: req.user.roles,
          permissions: req.user.permissions,
        },
        'Profile retrieved successfully'
      );

      res.status(response.statusCode).json(response.toJSON());
    } catch (error) {
      next(error);
    }
  }

  public async validateToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token = this.extractToken(req);

      if (!token) {
        const response = ApiResponse.badRequest('Token is required');
        res.status(response.statusCode).json(response.toJSON());
        return;
      }

      // The token validation will be handled by the auth middleware
      // If we reach here, the token is valid
      const response = ApiResponse.success({ valid: true }, 'Token is valid');

      res.status(response.statusCode).json(response.toJSON());
    } catch (error) {
      next(error);
    }
  }

  // Helper methods
  private extractToken(req: Request): string | null {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return null;
    }

    const parts = authHeader.split(' ');

    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return null;
    }

    return parts[1];
  }

  private getClientIp(req: Request): string | undefined {
    const forwarded = req.headers['x-forwarded-for'] as string;
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }

    return (
      (req.headers['x-real-ip'] as string) ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      undefined
    );
  }
}
