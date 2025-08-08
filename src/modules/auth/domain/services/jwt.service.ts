import { BaseService } from '../../../../shared/domain/services/base.service';

export interface TokenPayload {
  userId: string;
  email: string;
  tokenId: string;
  sessionId?: string;
}

export interface AccessTokenPayload extends TokenPayload {
  roles?: string[];
  permissions?: string[];
}

export interface RefreshTokenPayload extends TokenPayload {
  // Refresh tokens have minimal payload
  test: string;
}

export interface TokenValidationResult {
  isValid: boolean;
  payload?: TokenPayload;
  error?: string;
}

export abstract class JwtService extends BaseService {
  abstract generateAccessToken(payload: AccessTokenPayload): Promise<string>;
  abstract generateRefreshToken(payload: RefreshTokenPayload): Promise<string>;
  abstract verifyAccessToken(token: string): Promise<TokenValidationResult>;
  abstract verifyRefreshToken(token: string): Promise<TokenValidationResult>;
  abstract decodeToken(token: string): TokenPayload | null;
  abstract getTokenExpiry(token: string): Date | null;
  abstract isTokenExpired(token: string): boolean;
}
