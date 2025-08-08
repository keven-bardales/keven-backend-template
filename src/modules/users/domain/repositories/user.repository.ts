import { BaseRepository } from '../../../../shared/domain/repositories/base.repository';
import { UserEntity } from '../entities/user.entity';

export interface CreateUserData {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  isActive?: boolean;
  mustChangePassword?: boolean;
}

export interface UpdateUserData {
  email?: string;
  passwordHash?: string;
  firstName?: string;
  lastName?: string;
  isActive?: boolean;
  mustChangePassword?: boolean;
}

export abstract class UserRepository extends BaseRepository<
  UserEntity,
  CreateUserData,
  UpdateUserData
> {
  abstract findByEmail(email: string): Promise<UserEntity | null>;
  abstract findByEmailWithRoles(email: string): Promise<UserEntity | null>;
  abstract existsByEmail(email: string): Promise<boolean>;
  abstract findActiveUsers(options?: {
    skip?: number;
    take?: number;
    orderBy?: Record<string, 'asc' | 'desc'>;
  }): Promise<UserEntity[]>;
  abstract findInactiveUsers(options?: {
    skip?: number;
    take?: number;
    orderBy?: Record<string, 'asc' | 'desc'>;
  }): Promise<UserEntity[]>;
  abstract countActiveUsers(): Promise<number>;
  abstract countInactiveUsers(): Promise<number>;
  abstract findUsersThatMustChangePassword(): Promise<UserEntity[]>;
  abstract bulkUpdateStatus(userIds: string[], isActive: boolean): Promise<void>;
  abstract searchUsers(
    searchTerm: string,
    options?: {
      skip?: number;
      take?: number;
      includeInactive?: boolean;
    }
  ): Promise<UserEntity[]>;
}
