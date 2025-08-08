import { UnauthorizedException } from '../../../../shared/domain/exceptions/global-exceptions';
import {
  RefreshTokenUseCase,
  RefreshTokenRequest,
  RefreshTokenResponse,
} from '../../domain/use-cases/refresh-token.use-case';
import { TokenService } from '../../domain/services/token.service';
import { AuthRepository } from '../../domain/repositories/auth.repository';
import { UserRepository } from '../../../users/domain/repositories/user.repository';

export class RefreshTokenUseCaseImpl extends RefreshTokenUseCase {
  constructor(
    private readonly tokenService: TokenService,
    private readonly authRepository: AuthRepository,
    private readonly userRepository: UserRepository
  ) {
    super();
  }

  public async execute(request: RefreshTokenRequest): Promise<RefreshTokenResponse> {
    this.log('Attempting to refresh token');

    try {
      // Validate refresh token
      const refreshToken = await this.tokenService.validateRefreshToken(request.refreshToken);
      if (!refreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Check if user is still active
      const user = await this.userRepository.findById(refreshToken.userId);
      if (!user || !user.isActive) {
        this.log('Refresh failed: User not found or inactive', { userId: refreshToken.userId });
        throw new UnauthorizedException('User account is no longer valid');
      }

      // Find the session associated with this refresh token
      const session = await this.authRepository.findSessionByTokenId(refreshToken.id);
      if (!session || !session.isActive) {
        this.log('Refresh failed: Session not found or inactive', { tokenId: refreshToken.id });
        throw new UnauthorizedException('Session is no longer valid');
      }

      // Create new token pair
      const newTokenResult = await this.tokenService.refreshTokenPair(request.refreshToken);

      // Update session with new token IDs
      await this.authRepository.updateSession(session.id, {
        lastActivityAt: new Date(),
      });

      // Calculate expiry time in seconds
      const expiresIn = Math.floor(
        newTokenResult.tokenPair.accessToken.getTimeUntilExpiry() / 1000
      );

      this.log('Token refreshed successfully', {
        userId: user.id,
        sessionId: session.id,
      });

      return {
        accessToken: newTokenResult.accessTokenJwt,
        refreshToken: newTokenResult.refreshTokenJwt,
        expiresIn,
      };
    } catch (error) {
      this.logError('Token refresh failed', error);
      throw error;
    }
  }
}
