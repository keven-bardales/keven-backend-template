import { PrismaClient } from '@prisma/client';
import {
  AuthRepository,
  CreateAuthTokenData,
  UpdateAuthTokenData,
  CreateLoginSessionData,
  UpdateLoginSessionData,
} from '../../domain/repositories/auth.repository';
import { AuthTokenEntity, TokenType } from '../../domain/entities/auth-token.entity';
import { LoginSessionEntity } from '../../domain/entities/login-session.entity';
import { AuthMapper } from '../mappers/auth.mapper';
import {
  InternalServerErrorException,
  NotFoundException,
} from '../../../../shared/domain/exceptions/global-exceptions';

export class AuthRepositoryImpl extends AuthRepository {
  constructor(private readonly prisma: PrismaClient) {
    super();
  }

  // Base repository methods for AuthToken
  public async findById(id: string): Promise<AuthTokenEntity | null> {
    try {
      const token = await this.prisma.authToken.findUnique({
        where: { id },
      });

      return token ? AuthMapper.authTokenToDomain(token) : null;
    } catch (error) {
      console.error('Error finding auth token by id:', error);
      throw new InternalServerErrorException('Failed to find auth token');
    }
  }

  public async findAll(options?: {
    skip?: number;
    take?: number;
    orderBy?: Record<string, 'asc' | 'desc'>;
    where?: Record<string, any>;
  }): Promise<AuthTokenEntity[]> {
    try {
      const tokens = await this.prisma.authToken.findMany({
        skip: options?.skip,
        take: options?.take,
        orderBy: options?.orderBy,
        where: options?.where,
      });

      return AuthMapper.authTokensToDomainArray(tokens);
    } catch (error) {
      console.error('Error finding all auth tokens:', error);
      throw new InternalServerErrorException('Failed to find auth tokens');
    }
  }

  public async create(data: CreateAuthTokenData): Promise<AuthTokenEntity> {
    try {
      const prismaData = AuthMapper.authTokenToPrismaCreate(data);

      const token = await this.prisma.authToken.create({
        data: prismaData,
      });

      return AuthMapper.authTokenToDomain(token);
    } catch (error: any) {
      console.error('Error creating auth token:', error);
      throw new InternalServerErrorException('Failed to create auth token');
    }
  }

  public async update(id: string, data: UpdateAuthTokenData): Promise<AuthTokenEntity> {
    try {
      const prismaUpdate = AuthMapper.authTokenToPrismaUpdate(data);

      const token = await this.prisma.authToken.update({
        where: { id },
        data: prismaUpdate,
      });

      return AuthMapper.authTokenToDomain(token);
    } catch (error: any) {
      console.error('Error updating auth token:', error);

      if (error.code === 'P2025') {
        throw new NotFoundException('Auth token not found');
      }

      throw new InternalServerErrorException('Failed to update auth token');
    }
  }

  public async delete(id: string): Promise<void> {
    try {
      await this.prisma.authToken.delete({
        where: { id },
      });
    } catch (error: any) {
      console.error('Error deleting auth token:', error);

      if (error.code === 'P2025') {
        throw new NotFoundException('Auth token not found');
      }

      throw new InternalServerErrorException('Failed to delete auth token');
    }
  }

  public async exists(id: string): Promise<boolean> {
    try {
      const count = await this.prisma.authToken.count({
        where: { id },
      });

      return count > 0;
    } catch (error) {
      console.error('Error checking if auth token exists:', error);
      return false;
    }
  }

  public async count(where?: Record<string, any>): Promise<number> {
    try {
      return await this.prisma.authToken.count({ where });
    } catch (error) {
      console.error('Error counting auth tokens:', error);
      throw new InternalServerErrorException('Failed to count auth tokens');
    }
  }

  // Token specific methods
  public async findTokenByValue(token: string): Promise<AuthTokenEntity | null> {
    try {
      const authToken = await this.prisma.authToken.findUnique({
        where: { token },
      });

      return authToken ? AuthMapper.authTokenToDomain(authToken) : null;
    } catch (error) {
      console.error('Error finding token by value:', error);
      throw new InternalServerErrorException('Failed to find token');
    }
  }

  public async findTokensByUserId(userId: string, type?: TokenType): Promise<AuthTokenEntity[]> {
    try {
      const whereClause: any = { userId };
      if (type) {
        whereClause.type = type;
      }

      const tokens = await this.prisma.authToken.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
      });

      return AuthMapper.authTokensToDomainArray(tokens);
    } catch (error) {
      console.error('Error finding tokens by user ID:', error);
      throw new InternalServerErrorException('Failed to find user tokens');
    }
  }

  public async findValidTokenByValue(token: string): Promise<AuthTokenEntity | null> {
    try {
      const authToken = await this.prisma.authToken.findUnique({
        where: {
          token,
          isRevoked: false,
          expiresAt: {
            gt: new Date(),
          },
        },
      });

      return authToken ? AuthMapper.authTokenToDomain(authToken) : null;
    } catch (error) {
      console.error('Error finding valid token by value:', error);
      throw new InternalServerErrorException('Failed to find valid token');
    }
  }

  public async revokeToken(tokenId: string): Promise<void> {
    try {
      await this.prisma.authToken.update({
        where: { id: tokenId },
        data: { isRevoked: true },
      });
    } catch (error: any) {
      console.error('Error revoking token:', error);

      if (error.code === 'P2025') {
        throw new NotFoundException('Token not found');
      }

      throw new InternalServerErrorException('Failed to revoke token');
    }
  }

  public async revokeAllUserTokens(userId: string, type?: TokenType): Promise<void> {
    try {
      const whereClause: any = { userId, isRevoked: false };
      if (type) {
        whereClause.type = type;
      }

      await this.prisma.authToken.updateMany({
        where: whereClause,
        data: { isRevoked: true },
      });
    } catch (error) {
      console.error('Error revoking all user tokens:', error);
      throw new InternalServerErrorException('Failed to revoke user tokens');
    }
  }

  public async deleteExpiredTokens(): Promise<void> {
    try {
      await this.prisma.authToken.deleteMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
      });
    } catch (error) {
      console.error('Error deleting expired tokens:', error);
      throw new InternalServerErrorException('Failed to delete expired tokens');
    }
  }

  public async findExpiredTokens(): Promise<AuthTokenEntity[]> {
    try {
      const tokens = await this.prisma.authToken.findMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
      });

      return AuthMapper.authTokensToDomainArray(tokens);
    } catch (error) {
      console.error('Error finding expired tokens:', error);
      throw new InternalServerErrorException('Failed to find expired tokens');
    }
  }

  // Session methods
  public async createSession(data: CreateLoginSessionData): Promise<LoginSessionEntity> {
    try {
      const prismaData = AuthMapper.loginSessionToPrismaCreate(data);

      const session = await this.prisma.loginSession.create({
        data: prismaData,
      });

      return AuthMapper.loginSessionToDomain(session);
    } catch (error: any) {
      console.error('Error creating login session:', error);
      throw new InternalServerErrorException('Failed to create login session');
    }
  }

  public async findSessionById(id: string): Promise<LoginSessionEntity | null> {
    try {
      const session = await this.prisma.loginSession.findUnique({
        where: { id },
      });

      return session ? AuthMapper.loginSessionToDomain(session) : null;
    } catch (error) {
      console.error('Error finding session by id:', error);
      throw new InternalServerErrorException('Failed to find session');
    }
  }

  public async findSessionByTokenId(tokenId: string): Promise<LoginSessionEntity | null> {
    try {
      const session = await this.prisma.loginSession.findFirst({
        where: {
          OR: [{ accessTokenId: tokenId }, { refreshTokenId: tokenId }],
        },
      });

      return session ? AuthMapper.loginSessionToDomain(session) : null;
    } catch (error) {
      console.error('Error finding session by token ID:', error);
      throw new InternalServerErrorException('Failed to find session');
    }
  }

  public async findActiveSessionsByUserId(userId: string): Promise<LoginSessionEntity[]> {
    try {
      const sessions = await this.prisma.loginSession.findMany({
        where: {
          userId,
          isActive: true,
        },
        orderBy: { lastActivityAt: 'desc' },
      });

      return AuthMapper.loginSessionsToDomainArray(sessions);
    } catch (error) {
      console.error('Error finding active sessions by user ID:', error);
      throw new InternalServerErrorException('Failed to find active sessions');
    }
  }

  public async updateSession(
    id: string,
    data: UpdateLoginSessionData
  ): Promise<LoginSessionEntity> {
    try {
      const prismaUpdate = AuthMapper.loginSessionToPrismaUpdate(data);

      const session = await this.prisma.loginSession.update({
        where: { id },
        data: prismaUpdate,
      });

      return AuthMapper.loginSessionToDomain(session);
    } catch (error: any) {
      console.error('Error updating session:', error);

      if (error.code === 'P2025') {
        throw new NotFoundException('Session not found');
      }

      throw new InternalServerErrorException('Failed to update session');
    }
  }

  public async deactivateSession(id: string): Promise<void> {
    try {
      await this.prisma.loginSession.update({
        where: { id },
        data: { isActive: false },
      });
    } catch (error: any) {
      console.error('Error deactivating session:', error);

      if (error.code === 'P2025') {
        throw new NotFoundException('Session not found');
      }

      throw new InternalServerErrorException('Failed to deactivate session');
    }
  }

  public async deactivateAllUserSessions(userId: string): Promise<void> {
    try {
      await this.prisma.loginSession.updateMany({
        where: {
          userId,
          isActive: true,
        },
        data: { isActive: false },
      });
    } catch (error) {
      console.error('Error deactivating all user sessions:', error);
      throw new InternalServerErrorException('Failed to deactivate user sessions');
    }
  }

  public async findInactiveSessions(maxInactivityMinutes: number): Promise<LoginSessionEntity[]> {
    try {
      const cutoffTime = new Date(Date.now() - maxInactivityMinutes * 60 * 1000);

      const sessions = await this.prisma.loginSession.findMany({
        where: {
          isActive: true,
          lastActivityAt: {
            lt: cutoffTime,
          },
        },
      });

      return AuthMapper.loginSessionsToDomainArray(sessions);
    } catch (error) {
      console.error('Error finding inactive sessions:', error);
      throw new InternalServerErrorException('Failed to find inactive sessions');
    }
  }

  public async cleanupInactiveSessions(maxInactivityMinutes: number): Promise<void> {
    try {
      const cutoffTime = new Date(Date.now() - maxInactivityMinutes * 60 * 1000);

      await this.prisma.loginSession.updateMany({
        where: {
          isActive: true,
          lastActivityAt: {
            lt: cutoffTime,
          },
        },
        data: { isActive: false },
      });
    } catch (error) {
      console.error('Error cleaning up inactive sessions:', error);
      throw new InternalServerErrorException('Failed to cleanup inactive sessions');
    }
  }

  // Combined operations
  public async findSessionWithTokens(sessionId: string): Promise<{
    session: LoginSessionEntity;
    accessToken: AuthTokenEntity;
    refreshToken: AuthTokenEntity;
  } | null> {
    try {
      const sessionData = await this.prisma.loginSession.findUnique({
        where: { id: sessionId },
        include: {
          accessToken: true,
          refreshToken: true,
        },
      });

      if (!sessionData) {
        return null;
      }

      return {
        session: AuthMapper.loginSessionToDomain(sessionData),
        accessToken: AuthMapper.authTokenToDomain(sessionData.accessToken),
        refreshToken: AuthMapper.authTokenToDomain(sessionData.refreshToken),
      };
    } catch (error) {
      console.error('Error finding session with tokens:', error);
      throw new InternalServerErrorException('Failed to find session with tokens');
    }
  }

  public async revokeSessionAndTokens(sessionId: string): Promise<void> {
    try {
      await this.prisma.$transaction(async tx => {
        // Find the session
        const session = await tx.loginSession.findUnique({
          where: { id: sessionId },
        });

        if (!session) {
          throw new NotFoundException('Session not found');
        }

        // Deactivate session
        await tx.loginSession.update({
          where: { id: sessionId },
          data: { isActive: false },
        });

        // Revoke associated tokens
        await tx.authToken.updateMany({
          where: {
            id: { in: [session.accessTokenId, session.refreshTokenId] },
          },
          data: { isRevoked: true },
        });
      });
    } catch (error) {
      console.error('Error revoking session and tokens:', error);
      throw new InternalServerErrorException('Failed to revoke session and tokens');
    }
  }
}
