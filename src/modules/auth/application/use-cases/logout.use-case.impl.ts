import {
  LogoutUseCase,
  LogoutRequest,
  LogoutResponse,
} from '../../domain/use-cases/logout.use-case';
import { TokenService } from '../../domain/services/token.service';
import { AuthRepository } from '../../domain/repositories/auth.repository';
import { JwtService } from '../../domain/services/jwt.service';

export class LogoutUseCaseImpl extends LogoutUseCase {
  constructor(
    private readonly tokenService: TokenService,
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService
  ) {
    super();
  }

  public async execute(request: LogoutRequest): Promise<LogoutResponse> {
    this.log('User attempting to logout');

    try {
      let userId: string | undefined;
      let sessionId: string | undefined;

      // Get user ID from token if provided
      if (request.accessToken) {
        const tokenPayload = this.jwtService.decodeToken(request.accessToken);
        if (tokenPayload) {
          userId = tokenPayload.userId;
          sessionId = tokenPayload.sessionId;
        }
      }

      // If logout all sessions is requested
      if (request.logoutAllSessions && userId) {
        this.log('Logging out all sessions', { userId });

        // Revoke all user tokens
        await this.tokenService.revokeAllUserTokens(userId);

        // Deactivate all user sessions
        await this.authRepository.deactivateAllUserSessions(userId);

        return {
          success: true,
          message: 'Logged out from all sessions successfully',
        };
      }

      // Single session logout
      if (request.sessionId) {
        sessionId = request.sessionId;
      }

      if (sessionId) {
        this.log('Logging out specific session', { sessionId });

        // Revoke session and associated tokens
        await this.authRepository.revokeSessionAndTokens(sessionId);

        return {
          success: true,
          message: 'Logged out successfully',
        };
      }

      // Fallback: revoke specific tokens if provided
      const promises: Promise<void>[] = [];

      if (request.accessToken) {
        const accessToken = await this.tokenService.validateAccessToken(request.accessToken);
        if (accessToken) {
          promises.push(this.tokenService.revokeToken(accessToken.id));
        }
      }

      if (request.refreshToken) {
        const refreshToken = await this.tokenService.validateRefreshToken(request.refreshToken);
        if (refreshToken) {
          promises.push(this.tokenService.revokeToken(refreshToken.id));
        }
      }

      await Promise.all(promises);

      if (promises.length > 0) {
        this.log('Tokens revoked successfully');
        return {
          success: true,
          message: 'Logged out successfully',
        };
      }

      // No valid tokens or session found
      this.log('No valid session or tokens found for logout');
      return {
        success: true,
        message: 'Already logged out',
      };
    } catch (error) {
      this.logError('Logout failed', error);
      return {
        success: false,
        message: 'Logout failed',
      };
    }
  }
}
