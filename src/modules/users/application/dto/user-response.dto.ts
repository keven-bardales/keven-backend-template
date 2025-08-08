import { UserEntity } from '../../domain/entities/user.entity';

export interface UserResponseData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  isActive: boolean;
  mustChangePassword: boolean;
  createdAt: string;
  updatedAt: string;
}

export class UserResponseDto {
  public readonly id: string;
  public readonly email: string;
  public readonly firstName: string;
  public readonly lastName: string;
  public readonly fullName: string;
  public readonly isActive: boolean;
  public readonly mustChangePassword: boolean;
  public readonly createdAt: string;
  public readonly updatedAt: string;

  constructor(user: UserEntity) {
    this.id = user.id;
    this.email = user.email.getValue();
    this.firstName = user.firstName;
    this.lastName = user.lastName;
    this.fullName = user.getFullName();
    this.isActive = user.isActive;
    this.mustChangePassword = user.mustChangePassword;
    this.createdAt = user.createdAt.toISOString();
    this.updatedAt = user.updatedAt.toISOString();
  }

  public static fromEntity(user: UserEntity): UserResponseDto {
    return new UserResponseDto(user);
  }

  public static fromEntities(users: UserEntity[]): UserResponseDto[] {
    return users.map(user => new UserResponseDto(user));
  }

  public toJSON(): UserResponseData {
    return {
      id: this.id,
      email: this.email,
      firstName: this.firstName,
      lastName: this.lastName,
      fullName: this.fullName,
      isActive: this.isActive,
      mustChangePassword: this.mustChangePassword,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
