import jwt, { SignOptions } from 'jsonwebtoken';
import {
  JwtService,
  TokenPayload,
  AccessTokenPayload,
  RefreshTokenPayload,
  TokenValidationResult,
} from '../../domain/services/jwt.service';
import { EnvironmentConfigService } from '../../../../shared/infrastructure/config/environment.config';
import {
  InternalServerErrorException,
  UnauthorizedException,
} from '../../../../shared/domain/exceptions/global-exceptions';

export class JwtServiceImpl extends JwtService {
  private readonly accessTokenSecret: string;
  private readonly refreshTokenSecret: string;
  private readonly accessTokenExpiresIn: string;
  private readonly refreshTokenExpiresIn: string;

  constructor() {
    super();
    const envConfig = EnvironmentConfigService.getInstance().get();

    this.accessTokenSecret = envConfig.JWT_ACCESS_SECRET;
    this.refreshTokenSecret = envConfig.JWT_REFRESH_SECRET;
    this.accessTokenExpiresIn = envConfig.JWT_ACCESS_EXPIRES_IN;
    this.refreshTokenExpiresIn = envConfig.JWT_REFRESH_EXPIRES_IN;
  }

  public async generateAccessToken(payload: AccessTokenPayload): Promise<string> {
    try {
      this.log('Generating access token', { userId: payload.userId });

      const signOptions: SignOptions = {
        expiresIn: this.accessTokenExpiresIn,
        issuer: 'keven-backend',
        audience: 'keven-app',
        subject: payload.userId,
        jwtid: payload.tokenId,
      };

      const token = jwt.sign(
        {
          userId: payload.userId,
          email: payload.email,
          tokenId: payload.tokenId,
          sessionId: payload.sessionId,
          roles: payload.roles || [],
          permissions: payload.permissions || [],
          type: 'access',
        },
        this.accessTokenSecret,
        signOptions
      );

      this.log('Access token generated successfully');
      return token;
    } catch (error) {
      this.logError('Failed to generate access token', error);
      throw new InternalServerErrorException('Failed to generate access token');
    }
  }

  public async generateRefreshToken(payload: RefreshTokenPayload): Promise<string> {
    try {
      this.log('Generating refresh token', { userId: payload.userId });

      const token = jwt.sign(
        {
          userId: payload.userId,
          email: payload.email,
          tokenId: payload.tokenId,
          sessionId: payload.sessionId,
          type: 'refresh',
        },
        this.refreshTokenSecret,
        {
          expiresIn: this.refreshTokenExpiresIn,
          issuer: 'keven-backend',
          audience: 'keven-app',
          subject: payload.userId,
          jwtid: payload.tokenId,
        }
      );

      this.log('Refresh token generated successfully');
      return token;
    } catch (error) {
      this.logError('Failed to generate refresh token', error);
      throw new InternalServerErrorException('Failed to generate refresh token');
    }
  }

  public async verifyAccessToken(token: string): Promise<TokenValidationResult> {
    try {
      this.log('Verifying access token');

      const decoded = jwt.verify(token, this.accessTokenSecret, {
        issuer: 'keven-backend',
        audience: 'keven-app',
      }) as any;

      // Validate token type
      if (decoded.type !== 'access') {
        return { isValid: false, error: 'Invalid token type' };
      }

      const payload: TokenPayload = {
        userId: decoded.userId,
        email: decoded.email,
        tokenId: decoded.tokenId,
        sessionId: decoded.sessionId,
      };

      this.log('Access token verified successfully', { userId: payload.userId });
      return { isValid: true, payload };
    } catch (error: any) {
      this.logError('Access token verification failed', error);

      let errorMessage = 'Invalid token';
      if (error.name === 'TokenExpiredError') {
        errorMessage = 'Token expired';
      } else if (error.name === 'JsonWebTokenError') {
        errorMessage = 'Malformed token';
      }

      return { isValid: false, error: errorMessage };
    }
  }

  public async verifyRefreshToken(token: string): Promise<TokenValidationResult> {
    try {
      this.log('Verifying refresh token');

      const decoded = jwt.verify(token, this.refreshTokenSecret, {
        issuer: 'keven-backend',
        audience: 'keven-app',
      }) as any;

      // Validate token type
      if (decoded.type !== 'refresh') {
        return { isValid: false, error: 'Invalid token type' };
      }

      const payload: TokenPayload = {
        userId: decoded.userId,
        email: decoded.email,
        tokenId: decoded.tokenId,
        sessionId: decoded.sessionId,
      };

      this.log('Refresh token verified successfully', { userId: payload.userId });
      return { isValid: true, payload };
    } catch (error: any) {
      this.logError('Refresh token verification failed', error);

      let errorMessage = 'Invalid token';
      if (error.name === 'TokenExpiredError') {
        errorMessage = 'Token expired';
      } else if (error.name === 'JsonWebTokenError') {
        errorMessage = 'Malformed token';
      }

      return { isValid: false, error: errorMessage };
    }
  }

  public decodeToken(token: string): TokenPayload | null {
    try {
      const decoded = jwt.decode(token) as any;

      if (!decoded || typeof decoded !== 'object') {
        return null;
      }

      return {
        userId: decoded.userId,
        email: decoded.email,
        tokenId: decoded.tokenId,
        sessionId: decoded.sessionId,
      };
    } catch (error) {
      this.logError('Failed to decode token', error);
      return null;
    }
  }

  public getTokenExpiry(token: string): Date | null {
    try {
      const decoded = jwt.decode(token) as any;

      if (!decoded || !decoded.exp) {
        return null;
      }

      return new Date(decoded.exp * 1000);
    } catch (error) {
      this.logError('Failed to get token expiry', error);
      return null;
    }
  }

  public isTokenExpired(token: string): boolean {
    const expiry = this.getTokenExpiry(token);

    if (!expiry) {
      return true;
    }

    return expiry <= new Date();
  }
}
