import { BaseEntity } from '../../../../shared/domain/entities/base.entity';
import { UUID } from '../../../../shared/domain/value-objects/uuid.value-object';
import { DomainException } from '../../../../shared/domain/exceptions/global-exceptions';

export interface LoginSessionProps {
  id: string;
  userId: string;
  accessTokenId: string;
  refreshTokenId: string;
  deviceInfo?: string;
  ipAddress?: string;
  userAgent?: string;
  isActive: boolean;
  lastActivityAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class LoginSessionEntity extends BaseEntity {
  public readonly userId: string;
  public readonly accessTokenId: string;
  public readonly refreshTokenId: string;
  public readonly deviceInfo?: string;
  public readonly ipAddress?: string;
  public readonly userAgent?: string;
  public readonly isActive: boolean;
  public readonly lastActivityAt: Date;

  constructor(props: LoginSessionProps) {
    super(props.id, props.createdAt, props.updatedAt);

    this.userId = props.userId;
    this.accessTokenId = props.accessTokenId;
    this.refreshTokenId = props.refreshTokenId;
    this.deviceInfo = props.deviceInfo;
    this.ipAddress = props.ipAddress;
    this.userAgent = props.userAgent;
    this.isActive = props.isActive;
    this.lastActivityAt = props.lastActivityAt;

    this.validate();
  }

  public static create(data: {
    userId: string;
    accessTokenId: string;
    refreshTokenId: string;
    deviceInfo?: string;
    ipAddress?: string;
    userAgent?: string;
  }): LoginSessionEntity {
    const now = new Date();

    return new LoginSessionEntity({
      id: UUID.generate().getValue(),
      userId: data.userId,
      accessTokenId: data.accessTokenId,
      refreshTokenId: data.refreshTokenId,
      deviceInfo: data.deviceInfo,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      isActive: true,
      lastActivityAt: now,
      createdAt: now,
      updatedAt: now,
    });
  }

  public static fromPrimitives(data: {
    id: string;
    userId: string;
    accessTokenId: string;
    refreshTokenId: string;
    deviceInfo?: string;
    ipAddress?: string;
    userAgent?: string;
    isActive: boolean;
    lastActivityAt: Date;
    createdAt: Date;
    updatedAt: Date;
  }): LoginSessionEntity {
    return new LoginSessionEntity({
      id: data.id,
      userId: data.userId,
      accessTokenId: data.accessTokenId,
      refreshTokenId: data.refreshTokenId,
      deviceInfo: data.deviceInfo,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      isActive: data.isActive,
      lastActivityAt: data.lastActivityAt,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }

  public deactivate(): LoginSessionEntity {
    if (!this.isActive) {
      throw new DomainException('Session is already inactive');
    }

    return new LoginSessionEntity({
      id: this.id,
      userId: this.userId,
      accessTokenId: this.accessTokenId,
      refreshTokenId: this.refreshTokenId,
      deviceInfo: this.deviceInfo,
      ipAddress: this.ipAddress,
      userAgent: this.userAgent,
      isActive: false,
      lastActivityAt: this.lastActivityAt,
      createdAt: this.createdAt,
      updatedAt: new Date(),
    });
  }

  public updateLastActivity(): LoginSessionEntity {
    const now = new Date();

    return new LoginSessionEntity({
      id: this.id,
      userId: this.userId,
      accessTokenId: this.accessTokenId,
      refreshTokenId: this.refreshTokenId,
      deviceInfo: this.deviceInfo,
      ipAddress: this.ipAddress,
      userAgent: this.userAgent,
      isActive: this.isActive,
      lastActivityAt: now,
      createdAt: this.createdAt,
      updatedAt: now,
    });
  }

  public isExpired(maxInactivityMinutes: number = 30): boolean {
    const maxInactivityMs = maxInactivityMinutes * 60 * 1000;
    const inactiveDuration = Date.now() - this.lastActivityAt.getTime();

    return inactiveDuration > maxInactivityMs;
  }

  public getInactivityDuration(): number {
    return Date.now() - this.lastActivityAt.getTime();
  }

  public getDeviceFingerprint(): string {
    const parts = [this.deviceInfo || 'unknown', this.userAgent || 'unknown'];

    return Buffer.from(parts.join('|')).toString('base64');
  }

  private validate(): void {
    if (!this.userId || this.userId.trim().length === 0) {
      throw new DomainException('User ID cannot be empty');
    }

    if (!this.accessTokenId || this.accessTokenId.trim().length === 0) {
      throw new DomainException('Access token ID cannot be empty');
    }

    if (!this.refreshTokenId || this.refreshTokenId.trim().length === 0) {
      throw new DomainException('Refresh token ID cannot be empty');
    }

    // Validate UUID formats
    if (!UUID.isValid(this.userId)) {
      throw new DomainException('Invalid user ID format');
    }

    if (!UUID.isValid(this.accessTokenId)) {
      throw new DomainException('Invalid access token ID format');
    }

    if (!UUID.isValid(this.refreshTokenId)) {
      throw new DomainException('Invalid refresh token ID format');
    }

    if (this.lastActivityAt > new Date()) {
      throw new DomainException('Last activity cannot be in the future');
    }
  }

  public toPrimitives(): {
    id: string;
    userId: string;
    accessTokenId: string;
    refreshTokenId: string;
    deviceInfo?: string;
    ipAddress?: string;
    userAgent?: string;
    isActive: boolean;
    lastActivityAt: Date;
    createdAt: Date;
    updatedAt: Date;
  } {
    return {
      id: this.id,
      userId: this.userId,
      accessTokenId: this.accessTokenId,
      refreshTokenId: this.refreshTokenId,
      deviceInfo: this.deviceInfo,
      ipAddress: this.ipAddress,
      userAgent: this.userAgent,
      isActive: this.isActive,
      lastActivityAt: this.lastActivityAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
