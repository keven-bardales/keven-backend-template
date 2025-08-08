import { TokenService, TokenPair } from '../../domain/services/token.service';
import {
  JwtService,
  AccessTokenPayload,
  RefreshTokenPayload,
} from '../../domain/services/jwt.service';
import { AuthRepository } from '../../domain/repositories/auth.repository';
import { AuthTokenEntity, TokenType } from '../../domain/entities/auth-token.entity';
import { UserRepository } from '../../../users/domain/repositories/user.repository';
import {
  UnauthorizedException,
  NotFoundException,
} from '../../../../shared/domain/exceptions/global-exceptions';
import { EnvironmentConfigService } from '../../../../shared/infrastructure/config/environment.config';

export class TokenServiceImpl extends TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly authRepository: AuthRepository,
    private readonly userRepository: UserRepository
  ) {
    super();
  }

  public async createTokenPair(
    userId: string,
    deviceInfo?: string,
    ipAddress?: string
  ): Promise<{
    tokenPair: TokenPair;
    accessTokenJwt: string;
    refreshTokenJwt: string;
  }> {
    try {
      this.log('Creating token pair', { userId });

      // Get user details for token payload
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Calculate expiry dates
      const envConfig = EnvironmentConfigService.getInstance().get();
      const accessTokenExpiryMs = this.parseExpiryToMs(envConfig.JWT_ACCESS_EXPIRES_IN);
      const refreshTokenExpiryMs = this.parseExpiryToMs(envConfig.JWT_REFRESH_EXPIRES_IN);

      const now = new Date();
      const accessTokenExpiry = new Date(now.getTime() + accessTokenExpiryMs);
      const refreshTokenExpiry = new Date(now.getTime() + refreshTokenExpiryMs);

      // Create access token entity
      const accessToken = AuthTokenEntity.create({
        userId,
        token: '', // Will be filled with JWT
        type: TokenType.ACCESS,
        expiresAt: accessTokenExpiry,
        deviceInfo,
        ipAddress,
      });

      // Create refresh token entity
      const refreshToken = AuthTokenEntity.create({
        userId,
        token: '', // Will be filled with JWT
        type: TokenType.REFRESH,
        expiresAt: refreshTokenExpiry,
        deviceInfo,
        ipAddress,
      });

      // Store tokens in database first to get IDs
      const savedAccessToken = await this.authRepository.create({
        userId,
        token: accessToken.id, // Temporary, will be updated
        type: TokenType.ACCESS,
        expiresAt: accessTokenExpiry,
        deviceInfo,
        ipAddress,
      });

      const savedRefreshToken = await this.authRepository.create({
        userId,
        token: refreshToken.id, // Temporary, will be updated
        type: TokenType.REFRESH,
        expiresAt: refreshTokenExpiry,
        deviceInfo,
        ipAddress,
      });

      // Generate JWT tokens with token IDs
      const accessTokenPayload: AccessTokenPayload = {
        userId: user.id,
        email: user.email.getValue(),
        tokenId: savedAccessToken.id,
        roles: [], // TODO: Get from user roles when RBAC is implemented
        permissions: [], // TODO: Get from user permissions when RBAC is implemented
      };

      const refreshTokenPayload: RefreshTokenPayload = {
        userId: user.id,
        email: user.email.getValue(),
        tokenId: savedRefreshToken.id,
      };

      const accessTokenJwt = await this.jwtService.generateAccessToken(accessTokenPayload);
      const refreshTokenJwt = await this.jwtService.generateRefreshToken(refreshTokenPayload);

      // Update tokens with actual JWT values
      const updatedAccessToken = await this.authRepository.update(savedAccessToken.id, {
        // Keep the token ID as the database value for lookup
      });

      const updatedRefreshToken = await this.authRepository.update(savedRefreshToken.id, {
        // Keep the token ID as the database value for lookup
      });

      this.log('Token pair created successfully', { userId });

      return {
        tokenPair: {
          accessToken: updatedAccessToken,
          refreshToken: updatedRefreshToken,
        },
        accessTokenJwt,
        refreshTokenJwt,
      };
    } catch (error) {
      this.logError('Failed to create token pair', error);
      throw error;
    }
  }

  public async refreshTokenPair(refreshTokenJwt: string): Promise<{
    tokenPair: TokenPair;
    accessTokenJwt: string;
    refreshTokenJwt: string;
  }> {
    try {
      this.log('Refreshing token pair');

      // Verify and decode the refresh token
      const verification = await this.jwtService.verifyRefreshToken(refreshTokenJwt);
      if (!verification.isValid || !verification.payload) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Find the refresh token in database
      const refreshToken = await this.authRepository.findById(verification.payload.tokenId);
      if (!refreshToken || !refreshToken.isValid()) {
        throw new UnauthorizedException('Refresh token is not valid');
      }

      // Revoke the old tokens
      await this.revokeToken(refreshToken.id);

      // Find the associated access token and revoke it
      const session = await this.authRepository.findSessionByTokenId(refreshToken.id);
      if (session) {
        const accessToken = await this.authRepository.findById(session.accessTokenId);
        if (accessToken) {
          await this.revokeToken(accessToken.id);
        }
      }

      // Create new token pair
      const newTokens = await this.createTokenPair(
        refreshToken.userId,
        refreshToken.deviceInfo,
        refreshToken.ipAddress
      );

      this.log('Token pair refreshed successfully', { userId: refreshToken.userId });

      return newTokens;
    } catch (error) {
      this.logError('Failed to refresh token pair', error);
      throw error;
    }
  }

  public async revokeToken(tokenId: string): Promise<void> {
    try {
      this.log('Revoking token', { tokenId });

      await this.authRepository.revokeToken(tokenId);

      this.log('Token revoked successfully', { tokenId });
    } catch (error) {
      this.logError('Failed to revoke token', error);
      throw error;
    }
  }

  public async revokeAllUserTokens(userId: string): Promise<void> {
    try {
      this.log('Revoking all user tokens', { userId });

      await this.authRepository.revokeAllUserTokens(userId);

      this.log('All user tokens revoked successfully', { userId });
    } catch (error) {
      this.logError('Failed to revoke all user tokens', error);
      throw error;
    }
  }

  public async validateAccessToken(tokenJwt: string): Promise<AuthTokenEntity | null> {
    try {
      this.log('Validating access token');

      const verification = await this.jwtService.verifyAccessToken(tokenJwt);
      if (!verification.isValid || !verification.payload) {
        return null;
      }

      const token = await this.authRepository.findById(verification.payload.tokenId);
      if (!token || !token.isValid() || !token.isAccessToken()) {
        return null;
      }

      return token;
    } catch (error) {
      this.logError('Failed to validate access token', error);
      return null;
    }
  }

  public async validateRefreshToken(tokenJwt: string): Promise<AuthTokenEntity | null> {
    try {
      this.log('Validating refresh token');

      const verification = await this.jwtService.verifyRefreshToken(tokenJwt);
      if (!verification.isValid || !verification.payload) {
        return null;
      }

      const token = await this.authRepository.findById(verification.payload.tokenId);
      if (!token || !token.isValid() || !token.isRefreshToken()) {
        return null;
      }

      return token;
    } catch (error) {
      this.logError('Failed to validate refresh token', error);
      return null;
    }
  }

  public async cleanupExpiredTokens(): Promise<void> {
    try {
      this.log('Cleaning up expired tokens');

      await this.authRepository.deleteExpiredTokens();

      this.log('Expired tokens cleaned up successfully');
    } catch (error) {
      this.logError('Failed to cleanup expired tokens', error);
      throw error;
    }
  }

  public async createResetPasswordToken(userId: string): Promise<AuthTokenEntity> {
    try {
      this.log('Creating reset password token', { userId });

      // Reset password tokens expire in 1 hour
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

      const token = await this.authRepository.create({
        userId,
        token: '', // Will be generated as UUID by the entity
        type: TokenType.RESET_PASSWORD,
        expiresAt,
      });

      this.log('Reset password token created successfully', { userId, tokenId: token.id });

      return token;
    } catch (error) {
      this.logError('Failed to create reset password token', error);
      throw error;
    }
  }

  public async createEmailVerificationToken(userId: string): Promise<AuthTokenEntity> {
    try {
      this.log('Creating email verification token', { userId });

      // Email verification tokens expire in 24 hours
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      const token = await this.authRepository.create({
        userId,
        token: '', // Will be generated as UUID by the entity
        type: TokenType.EMAIL_VERIFICATION,
        expiresAt,
      });

      this.log('Email verification token created successfully', { userId, tokenId: token.id });

      return token;
    } catch (error) {
      this.logError('Failed to create email verification token', error);
      throw error;
    }
  }

  public async validateResetPasswordToken(token: string): Promise<AuthTokenEntity | null> {
    try {
      this.log('Validating reset password token');

      const authToken = await this.authRepository.findTokenByValue(token);
      if (!authToken || !authToken.isValid() || !authToken.isResetPasswordToken()) {
        return null;
      }

      return authToken;
    } catch (error) {
      this.logError('Failed to validate reset password token', error);
      return null;
    }
  }

  public async validateEmailVerificationToken(token: string): Promise<AuthTokenEntity | null> {
    try {
      this.log('Validating email verification token');

      const authToken = await this.authRepository.findTokenByValue(token);
      if (!authToken || !authToken.isValid() || !authToken.isEmailVerificationToken()) {
        return null;
      }

      return authToken;
    } catch (error) {
      this.logError('Failed to validate email verification token', error);
      return null;
    }
  }

  private parseExpiryToMs(expiry: string): number {
    // Convert JWT expiry format (e.g., "15m", "7d", "1h") to milliseconds
    const match = expiry.match(/^(\d+)([smhd])$/);
    if (!match) {
      throw new Error(`Invalid expiry format: ${expiry}`);
    }

    const [, amount, unit] = match;
    const value = parseInt(amount, 10);

    switch (unit) {
      case 's':
        return value * 1000;
      case 'm':
        return value * 60 * 1000;
      case 'h':
        return value * 60 * 60 * 1000;
      case 'd':
        return value * 24 * 60 * 60 * 1000;
      default:
        throw new Error(`Unsupported time unit: ${unit}`);
    }
  }
}
