import { User as PrismaUser } from '@prisma/client';
import { UserEntity } from '../../domain/entities/user.entity';
import { Email } from '../../../../shared/domain/value-objects/email.value-object';
import { CreateUserData, UpdateUserData } from '../../domain/repositories/user.repository';
import { v4 as uuidv4 } from 'uuid';

export class UserMapper {
  public static toDomain(prismaUser: PrismaUser): UserEntity {
    return UserEntity.fromPrimitives({
      id: prismaUser.id,
      email: prismaUser.email,
      passwordHash: prismaUser.passwordHash,
      firstName: prismaUser.firstName,
      lastName: prismaUser.lastName,
      isActive: prismaUser.isActive,
      mustChangePassword: prismaUser.mustChangePassword,
      createdAt: prismaUser.createdAt,
      updatedAt: prismaUser.updatedAt,
    });
  }

  public static toDomainArray(prismaUsers: PrismaUser[]): UserEntity[] {
    return prismaUsers.map(user => this.toDomain(user));
  }

  public static toPrismaCreate(createData: CreateUserData): {
    id: string;
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    isActive: boolean;
    mustChangePassword: boolean;
  } {
    const id = uuidv4();
    return {
      id,
      email: createData.email,
      passwordHash: createData.passwordHash,
      firstName: createData.firstName,
      lastName: createData.lastName,
      isActive: createData.isActive ?? true,
      mustChangePassword: createData.mustChangePassword ?? true,
    };
  }

  public static toPrismaUpdate(updateData: UpdateUserData): Partial<PrismaUser> {
    const prismaUpdate: Partial<PrismaUser> = {};

    if (updateData.email !== undefined) {
      prismaUpdate.email = updateData.email;
    }

    if (updateData.passwordHash !== undefined) {
      prismaUpdate.passwordHash = updateData.passwordHash;
    }

    if (updateData.firstName !== undefined) {
      prismaUpdate.firstName = updateData.firstName;
    }

    if (updateData.lastName !== undefined) {
      prismaUpdate.lastName = updateData.lastName;
    }

    if (updateData.isActive !== undefined) {
      prismaUpdate.isActive = updateData.isActive;
    }

    if (updateData.mustChangePassword !== undefined) {
      prismaUpdate.mustChangePassword = updateData.mustChangePassword;
    }

    return prismaUpdate;
  }

  public static fromDomainToPrisma(
    userEntity: UserEntity
  ): Omit<PrismaUser, 'createdAt' | 'updatedAt'> {
    const primitives = userEntity.toPrimitives();

    return {
      id: primitives.id,
      email: primitives.email,
      passwordHash: primitives.passwordHash,
      firstName: primitives.firstName,
      lastName: primitives.lastName,
      isActive: primitives.isActive,
      mustChangePassword: primitives.mustChangePassword,
    };
  }

  public static validateEmail(email: string): boolean {
    try {
      Email.create(email);
      return true;
    } catch {
      return false;
    }
  }
}
