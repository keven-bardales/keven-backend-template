import { BaseRepository } from '../../../../shared/domain/repositories/base.repository';
import { AuthTokenEntity, TokenType } from '../entities/auth-token.entity';
import { LoginSessionEntity } from '../entities/login-session.entity';

export interface CreateAuthTokenData {
  userId: string;
  token: string;
  type: TokenType;
  expiresAt: Date;
  deviceInfo?: string;
  ipAddress?: string;
}

export interface UpdateAuthTokenData {
  isRevoked?: boolean;
}

export interface CreateLoginSessionData {
  userId: string;
  accessTokenId: string;
  refreshTokenId: string;
  deviceInfo?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface UpdateLoginSessionData {
  isActive?: boolean;
  lastActivityAt?: Date;
}

export abstract class AuthRepository extends BaseRepository<
  AuthTokenEntity,
  CreateAuthTokenData,
  UpdateAuthTokenData
> {
  // Token operations
  abstract findTokenByValue(token: string): Promise<AuthTokenEntity | null>;
  abstract findTokensByUserId(userId: string, type?: TokenType): Promise<AuthTokenEntity[]>;
  abstract findValidTokenByValue(token: string): Promise<AuthTokenEntity | null>;
  abstract revokeToken(tokenId: string): Promise<void>;
  abstract revokeAllUserTokens(userId: string, type?: TokenType): Promise<void>;
  abstract deleteExpiredTokens(): Promise<void>;
  abstract findExpiredTokens(): Promise<AuthTokenEntity[]>;

  // Session operations
  abstract createSession(data: CreateLoginSessionData): Promise<LoginSessionEntity>;
  abstract findSessionById(id: string): Promise<LoginSessionEntity | null>;
  abstract findSessionByTokenId(tokenId: string): Promise<LoginSessionEntity | null>;
  abstract findActiveSessionsByUserId(userId: string): Promise<LoginSessionEntity[]>;
  abstract updateSession(id: string, data: UpdateLoginSessionData): Promise<LoginSessionEntity>;
  abstract deactivateSession(id: string): Promise<void>;
  abstract deactivateAllUserSessions(userId: string): Promise<void>;
  abstract findInactiveSessions(maxInactivityMinutes: number): Promise<LoginSessionEntity[]>;
  abstract cleanupInactiveSessions(maxInactivityMinutes: number): Promise<void>;

  // Combined operations
  abstract findSessionWithTokens(sessionId: string): Promise<{
    session: LoginSessionEntity;
    accessToken: AuthTokenEntity;
    refreshToken: AuthTokenEntity;
  } | null>;

  abstract revokeSessionAndTokens(sessionId: string): Promise<void>;
}
