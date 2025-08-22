import { BaseService } from '../../../../shared/domain/services/base.service';

export interface TokenPayload {
  userId: string;
  email: string;
  jti: string; // JWT ID for blacklisting
  tokenId?: string; // Legacy support - maps to jti
  iat: number; // Issued at
  exp: number; // Expires at
  sessionId?: string;
}

export interface AccessTokenPayload extends TokenPayload {
  roles?: string[];
  permissions?: string[];
  type: 'access';
}

export interface RefreshTokenPayload extends TokenPayload {
  type: 'refresh';
}

export interface TokenValidationResult<TPayload = TokenPayload> {
  isValid: boolean;
  payload?: TPayload;
  error?: string;
  isBlacklisted?: boolean;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiry: string;
  refreshTokenExpiry: string;
}

export abstract class JwtService extends BaseService {
  abstract generateAccessToken(
    payload: Omit<AccessTokenPayload, 'jti' | 'iat' | 'exp' | 'type'> & { jti?: string }
  ): Promise<string>;
  abstract generateRefreshToken(
    payload: Omit<RefreshTokenPayload, 'jti' | 'iat' | 'exp' | 'type'> & { jti?: string }
  ): Promise<string>;
  abstract generateTokenPair(payload: {
    userId: string;
    email: string;
    roles?: string[];
    permissions?: string[];
    sessionId?: string;
  }): Promise<TokenPair>;
  abstract verifyAccessToken(token: string): Promise<TokenValidationResult<AccessTokenPayload>>;
  abstract verifyRefreshToken(token: string): Promise<TokenValidationResult<RefreshTokenPayload>>;
  abstract decodeToken(token: string): TokenPayload | null;
  abstract getTokenExpiry(token: string): Date | null;
  abstract isTokenExpired(token: string): boolean;
  abstract blacklistToken(
    jti: string,
    userId: string,
    tokenType: 'access' | 'refresh',
    reason?: string
  ): Promise<void>;
  abstract blacklistAllUserTokens(userId: string, reason?: string): Promise<number>;
  abstract blacklistUserRefreshTokens(userId: string, reason?: string): Promise<number>;
  abstract isTokenBlacklisted(jti: string): Promise<boolean>;
  abstract refreshTokens(refreshToken: string): Promise<TokenPair>;
}
