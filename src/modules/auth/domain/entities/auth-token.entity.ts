import { BaseEntity } from '../../../../shared/domain/entities/base.entity';
import { UUID } from '../../../../shared/domain/value-objects/uuid.value-object';
import { DomainException } from '../../../../shared/domain/exceptions/global-exceptions';

export enum TokenType {
  ACCESS = 'ACCESS',
  REFRESH = 'REFRESH',
  RESET_PASSWORD = 'RESET_PASSWORD',
  EMAIL_VERIFICATION = 'EMAIL_VERIFICATION',
}

export interface AuthTokenProps {
  id: string;
  userId: string;
  token: string;
  type: TokenType;
  expiresAt: Date;
  isRevoked: boolean;
  deviceInfo?: string;
  ipAddress?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class AuthTokenEntity extends BaseEntity {
  public readonly userId: string;
  public readonly token: string;
  public readonly type: TokenType;
  public readonly expiresAt: Date;
  public readonly isRevoked: boolean;
  public readonly deviceInfo?: string;
  public readonly ipAddress?: string;

  constructor(props: AuthTokenProps) {
    super(props.id, props.createdAt, props.updatedAt);

    this.userId = props.userId;
    this.token = props.token;
    this.type = props.type;
    this.expiresAt = props.expiresAt;
    this.isRevoked = props.isRevoked;
    this.deviceInfo = props.deviceInfo;
    this.ipAddress = props.ipAddress;

    this.validate();
  }

  public static create(data: {
    userId: string;
    token: string;
    type: TokenType;
    expiresAt: Date;
    deviceInfo?: string;
    ipAddress?: string;
  }): AuthTokenEntity {
    const now = new Date();

    return new AuthTokenEntity({
      id: UUID.generate().getValue(),
      userId: data.userId,
      token: data.token,
      type: data.type,
      expiresAt: data.expiresAt,
      isRevoked: false,
      deviceInfo: data.deviceInfo,
      ipAddress: data.ipAddress,
      createdAt: now,
      updatedAt: now,
    });
  }

  public static fromPrimitives(data: {
    id: string;
    userId: string;
    token: string;
    type: string;
    expiresAt: Date;
    isRevoked: boolean;
    deviceInfo?: string;
    ipAddress?: string;
    createdAt: Date;
    updatedAt: Date;
  }): AuthTokenEntity {
    return new AuthTokenEntity({
      id: data.id,
      userId: data.userId,
      token: data.token,
      type: data.type as TokenType,
      expiresAt: data.expiresAt,
      isRevoked: data.isRevoked,
      deviceInfo: data.deviceInfo,
      ipAddress: data.ipAddress,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }

  public isExpired(): boolean {
    return this.expiresAt <= new Date();
  }

  public isValid(): boolean {
    return !this.isRevoked && !this.isExpired();
  }

  public revoke(): AuthTokenEntity {
    if (this.isRevoked) {
      throw new DomainException('Token is already revoked');
    }

    return new AuthTokenEntity({
      id: this.id,
      userId: this.userId,
      token: this.token,
      type: this.type,
      expiresAt: this.expiresAt,
      isRevoked: true,
      deviceInfo: this.deviceInfo,
      ipAddress: this.ipAddress,
      createdAt: this.createdAt,
      updatedAt: new Date(),
    });
  }

  public getTimeUntilExpiry(): number {
    return Math.max(0, this.expiresAt.getTime() - Date.now());
  }

  public isAccessToken(): boolean {
    return this.type === TokenType.ACCESS;
  }

  public isRefreshToken(): boolean {
    return this.type === TokenType.REFRESH;
  }

  public isResetPasswordToken(): boolean {
    return this.type === TokenType.RESET_PASSWORD;
  }

  public isEmailVerificationToken(): boolean {
    return this.type === TokenType.EMAIL_VERIFICATION;
  }

  private validate(): void {
    if (!this.userId || this.userId.trim().length === 0) {
      throw new DomainException('User ID cannot be empty');
    }

    if (!this.token || this.token.trim().length === 0) {
      throw new DomainException('Token cannot be empty');
    }

    if (!Object.values(TokenType).includes(this.type)) {
      throw new DomainException('Invalid token type');
    }

    if (this.expiresAt <= this.createdAt) {
      throw new DomainException('Expiry date must be after creation date');
    }

    // Validate UUID format for userId
    if (!UUID.isValid(this.userId)) {
      throw new DomainException('Invalid user ID format');
    }
  }

  public toPrimitives(): {
    id: string;
    userId: string;
    token: string;
    type: string;
    expiresAt: Date;
    isRevoked: boolean;
    deviceInfo?: string;
    ipAddress?: string;
    createdAt: Date;
    updatedAt: Date;
  } {
    return {
      id: this.id,
      userId: this.userId,
      token: this.token,
      type: this.type,
      expiresAt: this.expiresAt,
      isRevoked: this.isRevoked,
      deviceInfo: this.deviceInfo,
      ipAddress: this.ipAddress,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
