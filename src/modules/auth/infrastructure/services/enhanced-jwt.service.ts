import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import {
  JwtService,
  TokenPayload,
  AccessTokenPayload,
  RefreshTokenPayload,
  TokenValidationResult,
  TokenPair,
} from '../../domain/services/jwt.service';
import { EnvironmentConfigService } from '../../../../shared/infrastructure/config/environment.config';
import { TokenBlacklistService } from '../../../../shared/infrastructure/cache/token-blacklist.service';
import { LoggerService } from '../../../../shared/infrastructure/logging/logger.service';
import { DateUtils } from '../../../../shared/infrastructure/utils/date.utils';
import {
  TokenExpiredError,
  InvalidTokenError,
  UnauthorizedError,
} from '../../../../shared/domain/errors/domain-errors';

export class EnhancedJwtService extends JwtService {
  private readonly accessTokenSecret: string;
  private readonly refreshTokenSecret: string;
  private readonly accessTokenExpiresIn: string;
  private readonly refreshTokenExpiresIn: string;
  private readonly blacklistService: TokenBlacklistService;
  private readonly logger: LoggerService;

  constructor() {
    super();
    const envConfig = EnvironmentConfigService.getInstance().get();
    this.accessTokenSecret = envConfig.JWT_ACCESS_SECRET;
    this.refreshTokenSecret = envConfig.JWT_REFRESH_SECRET;
    this.accessTokenExpiresIn = envConfig.JWT_ACCESS_EXPIRES_IN;
    this.refreshTokenExpiresIn = envConfig.JWT_REFRESH_EXPIRES_IN;
    this.blacklistService = TokenBlacklistService.getInstance();
    this.logger = LoggerService.getInstance();
  }

  public async generateAccessToken(
    payload: Omit<AccessTokenPayload, 'jti' | 'iat' | 'exp' | 'type'>
  ): Promise<string> {
    try {
      const now = Math.floor(Date.now() / 1000);
      const jti = uuidv4();

      const fullPayload: AccessTokenPayload = {
        ...payload,
        jti,
        iat: now,
        exp: now + this.parseExpiryToSeconds(this.accessTokenExpiresIn),
        type: 'access',
      };

      const token = jwt.sign(fullPayload, this.accessTokenSecret, {
        algorithm: 'HS256',
      });

      this.logger.debug('Access token generated', {
        userId: payload.userId,
        jti,
        expiresIn: this.accessTokenExpiresIn,
      });

      return token;
    } catch (error) {
      this.logger.error('Failed to generate access token', error, {
        userId: payload.userId,
      });
      throw error;
    }
  }

  public async generateRefreshToken(
    payload: Omit<RefreshTokenPayload, 'jti' | 'iat' | 'exp' | 'type'>
  ): Promise<string> {
    try {
      const now = Math.floor(Date.now() / 1000);
      const jti = uuidv4();

      const fullPayload: RefreshTokenPayload = {
        ...payload,
        jti,
        iat: now,
        exp: now + this.parseExpiryToSeconds(this.refreshTokenExpiresIn),
        type: 'refresh',
      };

      const token = jwt.sign(fullPayload, this.refreshTokenSecret, {
        algorithm: 'HS256',
      });

      this.logger.debug('Refresh token generated', {
        userId: payload.userId,
        jti,
        expiresIn: this.refreshTokenExpiresIn,
      });

      return token;
    } catch (error) {
      this.logger.error('Failed to generate refresh token', error, {
        userId: payload.userId,
      });
      throw error;
    }
  }

  public async generateTokenPair(payload: {
    userId: string;
    email: string;
    roles?: string[];
    permissions?: string[];
    sessionId?: string;
  }): Promise<TokenPair> {
    try {
      const [accessToken, refreshToken] = await Promise.all([
        this.generateAccessToken({
          userId: payload.userId,
          email: payload.email,
          roles: payload.roles || [],
          permissions: payload.permissions || [],
          sessionId: payload.sessionId,
        }),
        this.generateRefreshToken({
          userId: payload.userId,
          email: payload.email,
          sessionId: payload.sessionId,
        }),
      ]);

      const accessPayload = this.decodeToken(accessToken) as AccessTokenPayload;
      const refreshPayload = this.decodeToken(refreshToken) as RefreshTokenPayload;

      return {
        accessToken,
        refreshToken,
        accessTokenExpiry: new Date(accessPayload.exp * 1000).toISOString(),
        refreshTokenExpiry: new Date(refreshPayload.exp * 1000).toISOString(),
      };
    } catch (error) {
      this.logger.error('Failed to generate token pair', error, {
        userId: payload.userId,
      });
      throw error;
    }
  }

  public async verifyAccessToken(token: string): Promise<TokenValidationResult> {
    try {
      const payload = jwt.verify(token, this.accessTokenSecret) as AccessTokenPayload;

      // Check if token is blacklisted
      const isBlacklisted = this.blacklistService.isTokenBlacklisted(payload.jti);
      if (isBlacklisted) {
        return {
          isValid: false,
          error: 'Token is blacklisted',
          isBlacklisted: true,
        };
      }

      // Verify token type
      if (payload.type !== 'access') {
        return {
          isValid: false,
          error: 'Invalid token type',
        };
      }

      return {
        isValid: true,
        payload,
      };
    } catch (error) {
      return this.handleJwtError(error);
    }
  }

  public async verifyRefreshToken(token: string): Promise<TokenValidationResult> {
    try {
      const payload = jwt.verify(token, this.refreshTokenSecret) as RefreshTokenPayload;

      // Check if token is blacklisted
      const isBlacklisted = this.blacklistService.isTokenBlacklisted(payload.jti);
      if (isBlacklisted) {
        return {
          isValid: false,
          error: 'Token is blacklisted',
          isBlacklisted: true,
        };
      }

      // Verify token type
      if (payload.type !== 'refresh') {
        return {
          isValid: false,
          error: 'Invalid token type',
        };
      }

      return {
        isValid: true,
        payload,
      };
    } catch (error) {
      return this.handleJwtError(error);
    }
  }

  public decodeToken(token: string): TokenPayload | null {
    try {
      const decoded = jwt.decode(token) as TokenPayload;
      return decoded;
    } catch (error) {
      this.logger.error('Failed to decode token', error);
      return null;
    }
  }

  public getTokenExpiry(token: string): Date | null {
    try {
      const payload = this.decodeToken(token);
      if (!payload || !payload.exp) {
        return null;
      }
      return new Date(payload.exp * 1000);
    } catch (error) {
      this.logger.error('Failed to get token expiry', error);
      return null;
    }
  }

  public isTokenExpired(token: string): boolean {
    try {
      const expiry = this.getTokenExpiry(token);
      if (!expiry) {
        return true;
      }
      return DateUtils.isAfter(DateUtils.utcNow(), expiry.toISOString());
    } catch (error) {
      this.logger.error('Failed to check token expiry', error);
      return true;
    }
  }

  public async blacklistToken(
    jti: string,
    userId: string,
    tokenType: 'access' | 'refresh',
    reason: string = 'manual'
  ): Promise<void> {
    try {
      // Calculate expiry time for the blacklist entry
      const expirySeconds =
        tokenType === 'access'
          ? this.parseExpiryToSeconds(this.accessTokenExpiresIn)
          : this.parseExpiryToSeconds(this.refreshTokenExpiresIn);

      const expiresAt = DateUtils.addMinutes(DateUtils.utcNow(), expirySeconds / 60);

      this.blacklistService.blacklistToken(jti, userId, tokenType, expiresAt, reason as any);

      this.logger.audit('Token blacklisted', {
        jti,
        userId,
        tokenType,
        reason,
        expiresAt,
      });
    } catch (error) {
      this.logger.error('Failed to blacklist token', error, {
        jti,
        userId,
        tokenType,
        reason,
      });
      throw error;
    }
  }

  public async blacklistAllUserTokens(
    userId: string,
    reason: string = 'logout_all'
  ): Promise<number> {
    try {
      const count = this.blacklistService.blacklistAllUserTokens(userId, reason as any);

      this.logger.audit('All user tokens blacklisted', {
        userId,
        reason,
        count,
      });

      return count;
    } catch (error) {
      this.logger.error('Failed to blacklist all user tokens', error, {
        userId,
        reason,
      });
      throw error;
    }
  }

  public async blacklistUserRefreshTokens(
    userId: string,
    reason: string = 'password_change'
  ): Promise<number> {
    try {
      const count = this.blacklistService.blacklistUserRefreshTokens(userId, reason as any);

      this.logger.audit('User refresh tokens blacklisted', {
        userId,
        reason,
        count,
      });

      return count;
    } catch (error) {
      this.logger.error('Failed to blacklist user refresh tokens', error, {
        userId,
        reason,
      });
      throw error;
    }
  }

  public async isTokenBlacklisted(jti: string): Promise<boolean> {
    try {
      return this.blacklistService.isTokenBlacklisted(jti);
    } catch (error) {
      this.logger.error('Failed to check token blacklist status', error, { jti });
      return false;
    }
  }

  public async refreshTokens(refreshToken: string): Promise<TokenPair> {
    try {
      // Verify the refresh token
      const verification = await this.verifyRefreshToken(refreshToken);
      if (!verification.isValid || !verification.payload) {
        throw new InvalidTokenError('Invalid refresh token');
      }

      const payload = verification.payload as RefreshTokenPayload;

      // Blacklist the old refresh token
      await this.blacklistToken(payload.jti, payload.userId, 'refresh', 'token_refresh');

      // Generate new token pair
      const newTokens = await this.generateTokenPair({
        userId: payload.userId,
        email: payload.email,
        sessionId: payload.sessionId,
        // Note: In a real implementation, you'd fetch fresh roles and permissions from database
      });

      this.logger.info('Tokens refreshed successfully', {
        userId: payload.userId,
        oldJti: payload.jti,
      });

      return newTokens;
    } catch (error) {
      this.logger.error('Failed to refresh tokens', error);
      throw error;
    }
  }

  private handleJwtError(error: any): TokenValidationResult {
    if (error instanceof jwt.TokenExpiredError) {
      return {
        isValid: false,
        error: 'Token has expired',
      };
    }

    if (error instanceof jwt.JsonWebTokenError) {
      return {
        isValid: false,
        error: 'Invalid token',
      };
    }

    if (error instanceof jwt.NotBeforeError) {
      return {
        isValid: false,
        error: 'Token not active yet',
      };
    }

    this.logger.error('Unexpected JWT error', error);
    return {
      isValid: false,
      error: 'Token verification failed',
    };
  }

  private parseExpiryToSeconds(expiry: string): number {
    const match = expiry.match(/^(\d+)([smhd])$/);
    if (!match) {
      throw new Error(`Invalid expiry format: ${expiry}`);
    }

    const [, amount, unit] = match;
    const value = parseInt(amount, 10);

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 60 * 60;
      case 'd':
        return value * 24 * 60 * 60;
      default:
        throw new Error(`Unsupported time unit: ${unit}`);
    }
  }
}
