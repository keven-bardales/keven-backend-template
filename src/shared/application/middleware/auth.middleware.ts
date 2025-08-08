import { Request, Response, NextFunction } from 'express';
import {
  UnauthorizedException,
  ForbiddenException,
} from '../../domain/exceptions/global-exceptions';

export interface AuthenticatedUser {
  id: string;
  email: string;
  sessionId?: string;
  roles: string[];
  permissions: string[];
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

export class AuthMiddleware {
  // Static references to services - will be injected via dependency container
  private static jwtService: any; // Will be properly typed when integrated
  private static tokenService: any; // Will be properly typed when integrated

  public static setServices(jwtService: any, tokenService: any) {
    AuthMiddleware.jwtService = jwtService;
    AuthMiddleware.tokenService = tokenService;
  }

  public static authenticate() {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
      try {
        const token = AuthMiddleware.extractToken(req);

        if (!token) {
          throw new UnauthorizedException('Access token is required');
        }

        // For now, we'll implement a basic version
        // TODO: Integrate with actual JWT service when dependency injection is complete
        if (AuthMiddleware.jwtService && AuthMiddleware.tokenService) {
          const verification = await AuthMiddleware.jwtService.verifyAccessToken(token);

          if (!verification.isValid || !verification.payload) {
            throw new UnauthorizedException('Invalid access token');
          }

          // Validate token in database
          const authToken = await AuthMiddleware.tokenService.validateAccessToken(token);
          if (!authToken) {
            throw new UnauthorizedException('Token is not valid or expired');
          }

          req.user = {
            id: verification.payload.userId,
            email: verification.payload.email,
            sessionId: verification.payload.sessionId,
            roles: verification.payload.roles || [],
            permissions: verification.payload.permissions || [],
          };
        } else {
          // Fallback for development - create a mock user
          console.warn('⚠️  Auth services not configured, using mock authentication');
          req.user = {
            id: 'mock-user-id',
            email: 'mock@example.com',
            roles: ['user'],
            permissions: ['read'],
          };
        }

        next();
      } catch (error) {
        next(error);
      }
    };
  }

  public static authorize(requiredPermissions: string[]) {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
      try {
        if (!req.user) {
          throw new UnauthorizedException('User not authenticated');
        }

        const hasPermission = requiredPermissions.some(permission =>
          req.user!.permissions.includes(permission)
        );

        if (!hasPermission) {
          throw new ForbiddenException('Insufficient permissions');
        }

        next();
      } catch (error) {
        next(error);
      }
    };
  }

  public static requireRole(requiredRoles: string[]) {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
      try {
        if (!req.user) {
          throw new UnauthorizedException('User not authenticated');
        }

        const hasRole = requiredRoles.some(role => req.user!.roles.includes(role));

        if (!hasRole) {
          throw new ForbiddenException('Insufficient role permissions');
        }

        next();
      } catch (error) {
        next(error);
      }
    };
  }

  public static optional() {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
      try {
        const token = AuthMiddleware.extractToken(req);

        if (token) {
          // TODO: Implement JWT verification and user extraction
          // This will be implemented when we create the JWT service
          // const user = await jwtService.verifyAccessToken(token);
          // req.user = user;
        }

        // Continue regardless of authentication status
        next();
      } catch (error) {
        // For optional authentication, continue even if token verification fails
        next();
      }
    };
  }

  private static extractToken(req: Request): string | null {
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
}
