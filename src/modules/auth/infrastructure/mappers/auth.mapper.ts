import { AuthToken as PrismaAuthToken, LoginSession as PrismaLoginSession } from '@prisma/client';
import { AuthTokenEntity, TokenType } from '../../domain/entities/auth-token.entity';
import { LoginSessionEntity } from '../../domain/entities/login-session.entity';
import {
  CreateAuthTokenData,
  CreateLoginSessionData,
  UpdateAuthTokenData,
  UpdateLoginSessionData,
} from '../../domain/repositories/auth.repository';
import { v4 as uuidv4 } from 'uuid';

export class AuthMapper {
  // Auth Token Mappings
  public static authTokenToDomain(prismaToken: PrismaAuthToken): AuthTokenEntity {
    return AuthTokenEntity.fromPrimitives({
      id: prismaToken.id,
      userId: prismaToken.userId,
      token: prismaToken.token,
      type: prismaToken.type,
      expiresAt: prismaToken.expiresAt,
      isRevoked: prismaToken.isRevoked,
      deviceInfo: prismaToken.deviceInfo || undefined,
      ipAddress: prismaToken.ipAddress || undefined,
      createdAt: prismaToken.createdAt,
      updatedAt: prismaToken.updatedAt,
    });
  }

  public static authTokensToDomainArray(prismaTokens: PrismaAuthToken[]): AuthTokenEntity[] {
    return prismaTokens.map(token => this.authTokenToDomain(token));
  }

  public static authTokenToPrismaCreate(createData: CreateAuthTokenData): {
    id: string;
    userId: string;
    token: string;
    type: string;
    expiresAt: Date;
    isRevoked: boolean;
    deviceInfo?: string;
    ipAddress?: string;
  } {
    const id = createData.id || uuidv4();
    return {
      id,
      userId: createData.userId,
      token: createData.token || id, // Use token value or fallback to ID
      type: createData.type,
      expiresAt: createData.expiresAt,
      isRevoked: false,
      deviceInfo: createData.deviceInfo,
      ipAddress: createData.ipAddress,
    };
  }

  public static authTokenToPrismaUpdate(updateData: UpdateAuthTokenData): Partial<PrismaAuthToken> {
    const prismaUpdate: Partial<PrismaAuthToken> = {};

    if (updateData.isRevoked !== undefined) {
      prismaUpdate.isRevoked = updateData.isRevoked;
    }

    return prismaUpdate;
  }

  // Login Session Mappings
  public static loginSessionToDomain(prismaSession: PrismaLoginSession): LoginSessionEntity {
    return LoginSessionEntity.fromPrimitives({
      id: prismaSession.id,
      userId: prismaSession.userId,
      accessTokenId: prismaSession.accessTokenId,
      refreshTokenId: prismaSession.refreshTokenId,
      deviceInfo: prismaSession.deviceInfo || undefined,
      ipAddress: prismaSession.ipAddress || undefined,
      userAgent: prismaSession.userAgent || undefined,
      isActive: prismaSession.isActive,
      lastActivityAt: prismaSession.lastActivityAt,
      createdAt: prismaSession.createdAt,
      updatedAt: prismaSession.updatedAt,
    });
  }

  public static loginSessionsToDomainArray(
    prismaSessions: PrismaLoginSession[]
  ): LoginSessionEntity[] {
    return prismaSessions.map(session => this.loginSessionToDomain(session));
  }

  public static loginSessionToPrismaCreate(createData: CreateLoginSessionData): {
    id: string;
    userId: string;
    accessTokenId: string;
    refreshTokenId: string;
    deviceInfo?: string;
    ipAddress?: string;
    userAgent?: string;
    isActive: boolean;
    lastActivityAt: Date;
  } {
    const id = uuidv4();
    const now = new Date();
    return {
      id,
      userId: createData.userId,
      accessTokenId: createData.accessTokenId,
      refreshTokenId: createData.refreshTokenId,
      deviceInfo: createData.deviceInfo,
      ipAddress: createData.ipAddress,
      userAgent: createData.userAgent,
      isActive: true,
      lastActivityAt: now,
    };
  }

  public static loginSessionToPrismaUpdate(
    updateData: UpdateLoginSessionData
  ): Partial<PrismaLoginSession> {
    const prismaUpdate: Partial<PrismaLoginSession> = {};

    if (updateData.isActive !== undefined) {
      prismaUpdate.isActive = updateData.isActive;
    }

    if (updateData.lastActivityAt !== undefined) {
      prismaUpdate.lastActivityAt = updateData.lastActivityAt;
    }

    return prismaUpdate;
  }

  // Utility methods
  public static validateTokenType(type: string): TokenType {
    const tokenType = type as TokenType;
    if (!Object.values(TokenType).includes(tokenType)) {
      throw new Error(`Invalid token type: ${type}`);
    }
    return tokenType;
  }

  public static tokenTypeToString(type: TokenType): string {
    return type.toString();
  }
}
