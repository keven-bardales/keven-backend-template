import { PrismaClient } from '@prisma/client';
import {
  UserRepository,
  CreateUserData,
  UpdateUserData,
} from '../../domain/repositories/user.repository';
import { UserEntity } from '../../domain/entities/user.entity';
import { UserMapper } from '../mappers/user.mapper';
import {
  InternalServerErrorException,
  NotFoundException,
} from '../../../../shared/domain/exceptions/global-exceptions';

export class UserRepositoryImpl extends UserRepository {
  constructor(private readonly prisma: PrismaClient) {
    super();
  }

  public async findById(id: string): Promise<UserEntity | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
      });

      return user ? UserMapper.toDomain(user) : null;
    } catch (error) {
      console.error('Error finding user by id:', error);
      throw new InternalServerErrorException('Failed to find user');
    }
  }

  public async findByEmail(email: string): Promise<UserEntity | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      return user ? UserMapper.toDomain(user) : null;
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw new InternalServerErrorException('Failed to find user');
    }
  }

  public async findByEmailWithRoles(email: string): Promise<UserEntity | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email: email.toLowerCase() },
        include: {
          userRoles: {
            include: {
              role: true,
            },
          },
        },
      });

      // For now, just return the user without roles
      // We'll enhance this when we implement the Role system
      return user ? UserMapper.toDomain(user) : null;
    } catch (error) {
      console.error('Error finding user by email with roles:', error);
      throw new InternalServerErrorException('Failed to find user');
    }
  }

  public async findAll(options?: {
    skip?: number;
    take?: number;
    orderBy?: Record<string, 'asc' | 'desc'>;
    where?: Record<string, any>;
  }): Promise<UserEntity[]> {
    try {
      const users = await this.prisma.user.findMany({
        skip: options?.skip,
        take: options?.take,
        orderBy: options?.orderBy,
        where: options?.where,
      });

      return UserMapper.toDomainArray(users);
    } catch (error) {
      console.error('Error finding all users:', error);
      throw new InternalServerErrorException('Failed to find users');
    }
  }

  public async create(data: CreateUserData): Promise<UserEntity> {
    try {
      const prismaData = UserMapper.toPrismaCreate(data);

      const user = await this.prisma.user.create({
        data: prismaData,
      });

      return UserMapper.toDomain(user);
    } catch (error: any) {
      console.error('Error creating user:', error);

      // Handle unique constraint violation (email already exists)
      if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
        throw new InternalServerErrorException('Email already exists');
      }

      throw new InternalServerErrorException('Failed to create user');
    }
  }

  public async update(id: string, data: UpdateUserData): Promise<UserEntity> {
    try {
      const prismaUpdate = UserMapper.toPrismaUpdate(data);

      const user = await this.prisma.user.update({
        where: { id },
        data: prismaUpdate,
      });

      return UserMapper.toDomain(user);
    } catch (error: any) {
      console.error('Error updating user:', error);

      // Handle record not found
      if (error.code === 'P2025') {
        throw new NotFoundException('User not found');
      }

      // Handle unique constraint violation
      if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
        throw new InternalServerErrorException('Email already exists');
      }

      throw new InternalServerErrorException('Failed to update user');
    }
  }

  public async delete(id: string): Promise<void> {
    try {
      await this.prisma.user.delete({
        where: { id },
      });
    } catch (error: any) {
      console.error('Error deleting user:', error);

      // Handle record not found
      if (error.code === 'P2025') {
        throw new NotFoundException('User not found');
      }

      throw new InternalServerErrorException('Failed to delete user');
    }
  }

  public async exists(id: string): Promise<boolean> {
    try {
      const count = await this.prisma.user.count({
        where: { id },
      });

      return count > 0;
    } catch (error) {
      console.error('Error checking if user exists:', error);
      return false;
    }
  }

  public async existsByEmail(email: string): Promise<boolean> {
    try {
      const count = await this.prisma.user.count({
        where: { email: email.toLowerCase() },
      });

      return count > 0;
    } catch (error) {
      console.error('Error checking if user exists by email:', error);
      return false;
    }
  }

  public async count(where?: Record<string, any>): Promise<number> {
    try {
      return await this.prisma.user.count({ where });
    } catch (error) {
      console.error('Error counting users:', error);
      throw new InternalServerErrorException('Failed to count users');
    }
  }

  public async findActiveUsers(options?: {
    skip?: number;
    take?: number;
    orderBy?: Record<string, 'asc' | 'desc'>;
  }): Promise<UserEntity[]> {
    try {
      const users = await this.prisma.user.findMany({
        where: { isActive: true },
        skip: options?.skip,
        take: options?.take,
        orderBy: options?.orderBy,
      });

      return UserMapper.toDomainArray(users);
    } catch (error) {
      console.error('Error finding active users:', error);
      throw new InternalServerErrorException('Failed to find active users');
    }
  }

  public async findInactiveUsers(options?: {
    skip?: number;
    take?: number;
    orderBy?: Record<string, 'asc' | 'desc'>;
  }): Promise<UserEntity[]> {
    try {
      const users = await this.prisma.user.findMany({
        where: { isActive: false },
        skip: options?.skip,
        take: options?.take,
        orderBy: options?.orderBy,
      });

      return UserMapper.toDomainArray(users);
    } catch (error) {
      console.error('Error finding inactive users:', error);
      throw new InternalServerErrorException('Failed to find inactive users');
    }
  }

  public async countActiveUsers(): Promise<number> {
    try {
      return await this.prisma.user.count({
        where: { isActive: true },
      });
    } catch (error) {
      console.error('Error counting active users:', error);
      throw new InternalServerErrorException('Failed to count active users');
    }
  }

  public async countInactiveUsers(): Promise<number> {
    try {
      return await this.prisma.user.count({
        where: { isActive: false },
      });
    } catch (error) {
      console.error('Error counting inactive users:', error);
      throw new InternalServerErrorException('Failed to count inactive users');
    }
  }

  public async findUsersThatMustChangePassword(): Promise<UserEntity[]> {
    try {
      const users = await this.prisma.user.findMany({
        where: { mustChangePassword: true },
      });

      return UserMapper.toDomainArray(users);
    } catch (error) {
      console.error('Error finding users that must change password:', error);
      throw new InternalServerErrorException('Failed to find users that must change password');
    }
  }

  public async bulkUpdateStatus(userIds: string[], isActive: boolean): Promise<void> {
    try {
      await this.prisma.user.updateMany({
        where: {
          id: { in: userIds },
        },
        data: { isActive },
      });
    } catch (error) {
      console.error('Error bulk updating user status:', error);
      throw new InternalServerErrorException('Failed to bulk update user status');
    }
  }

  public async searchUsers(
    searchTerm: string,
    options?: {
      skip?: number;
      take?: number;
      includeInactive?: boolean;
    }
  ): Promise<UserEntity[]> {
    try {
      const whereConditions: any = {
        OR: [
          { firstName: { contains: searchTerm, mode: 'insensitive' } },
          { lastName: { contains: searchTerm, mode: 'insensitive' } },
          { email: { contains: searchTerm, mode: 'insensitive' } },
        ],
      };

      if (!options?.includeInactive) {
        whereConditions.isActive = true;
      }

      const users = await this.prisma.user.findMany({
        where: whereConditions,
        skip: options?.skip,
        take: options?.take,
        orderBy: { createdAt: 'desc' },
      });

      return UserMapper.toDomainArray(users);
    } catch (error) {
      console.error('Error searching users:', error);
      throw new InternalServerErrorException('Failed to search users');
    }
  }
}
