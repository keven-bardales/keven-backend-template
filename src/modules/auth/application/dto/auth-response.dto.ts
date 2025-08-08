import { UserEntity } from '../../../users/domain/entities/user.entity';
import { LoginResult } from '../../domain/services/token.service';

export interface AuthUserData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  mustChangePassword: boolean;
  isActive: boolean;
}

export interface LoginResponseData {
  user: AuthUserData;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
  sessionId: string;
}

export interface RefreshTokenResponseData {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

export class AuthResponseDto {
  public readonly user: AuthUserData;
  public readonly accessToken: string;
  public readonly refreshToken: string;
  public readonly expiresIn: number;
  public readonly tokenType: string;
  public readonly sessionId: string;

  constructor(user: UserEntity, loginResult: LoginResult) {
    this.user = {
      id: user.id,
      email: user.email.getValue(),
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.getFullName(),
      mustChangePassword: user.mustChangePassword,
      isActive: user.isActive,
    };

    this.accessToken = loginResult.accessTokenJwt;
    this.refreshToken = loginResult.refreshTokenJwt;
    this.expiresIn = Math.floor(loginResult.tokens.accessToken.getTimeUntilExpiry() / 1000);
    this.tokenType = 'Bearer';
    this.sessionId = loginResult.session.id;
  }

  public static fromLoginResult(user: UserEntity, loginResult: LoginResult): AuthResponseDto {
    return new AuthResponseDto(user, loginResult);
  }

  public toJSON(): LoginResponseData {
    return {
      user: this.user,
      accessToken: this.accessToken,
      refreshToken: this.refreshToken,
      expiresIn: this.expiresIn,
      tokenType: this.tokenType,
      sessionId: this.sessionId,
    };
  }
}

export class RefreshTokenResponseDto {
  public readonly accessToken: string;
  public readonly refreshToken: string;
  public readonly expiresIn: number;
  public readonly tokenType: string;

  constructor(data: { accessTokenJwt: string; refreshTokenJwt: string; expiresIn: number }) {
    this.accessToken = data.accessTokenJwt;
    this.refreshToken = data.refreshTokenJwt;
    this.expiresIn = data.expiresIn;
    this.tokenType = 'Bearer';
  }

  public toJSON(): RefreshTokenResponseData {
    return {
      accessToken: this.accessToken,
      refreshToken: this.refreshToken,
      expiresIn: this.expiresIn,
      tokenType: this.tokenType,
    };
  }
}
