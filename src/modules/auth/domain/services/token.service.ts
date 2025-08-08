import { BaseService } from '../../../../shared/domain/services/base.service';
import { AuthTokenEntity, TokenType } from '../entities/auth-token.entity';
import { LoginSessionEntity } from '../entities/login-session.entity';

export interface TokenPair {
  accessToken: AuthTokenEntity;
  refreshToken: AuthTokenEntity;
}

export interface LoginResult {
  session: LoginSessionEntity;
  tokens: TokenPair;
  accessTokenJwt: string;
  refreshTokenJwt: string;
}

export abstract class TokenService extends BaseService {
  abstract createTokenPair(
    userId: string,
    deviceInfo?: string,
    ipAddress?: string
  ): Promise<{
    tokenPair: TokenPair;
    accessTokenJwt: string;
    refreshTokenJwt: string;
  }>;

  abstract refreshTokenPair(refreshToken: string): Promise<{
    tokenPair: TokenPair;
    accessTokenJwt: string;
    refreshTokenJwt: string;
  }>;

  abstract revokeToken(tokenId: string): Promise<void>;
  abstract revokeAllUserTokens(userId: string): Promise<void>;
  abstract validateAccessToken(token: string): Promise<AuthTokenEntity | null>;
  abstract validateRefreshToken(token: string): Promise<AuthTokenEntity | null>;
  abstract cleanupExpiredTokens(): Promise<void>;

  abstract createResetPasswordToken(userId: string): Promise<AuthTokenEntity>;
  abstract createEmailVerificationToken(userId: string): Promise<AuthTokenEntity>;
  abstract validateResetPasswordToken(token: string): Promise<AuthTokenEntity | null>;
  abstract validateEmailVerificationToken(token: string): Promise<AuthTokenEntity | null>;
}
