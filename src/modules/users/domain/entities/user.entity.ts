import { BaseEntity } from '../../../../shared/domain/entities/base.entity';
import { Email } from '../../../../shared/domain/value-objects/email.value-object';
import { UUID } from '../../../../shared/domain/value-objects/uuid.value-object';
import { DomainException } from '../../../../shared/domain/exceptions/global-exceptions';

export interface UserProps {
  id: string;
  email: Email;
  passwordHash: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  mustChangePassword: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class UserEntity extends BaseEntity {
  public readonly email: Email;
  public readonly passwordHash: string;
  public readonly firstName: string;
  public readonly lastName: string;
  public readonly isActive: boolean;
  public readonly mustChangePassword: boolean;

  constructor(props: UserProps) {
    super(props.id, props.createdAt, props.updatedAt);

    this.email = props.email;
    this.passwordHash = props.passwordHash;
    this.firstName = props.firstName;
    this.lastName = props.lastName;
    this.isActive = props.isActive;
    this.mustChangePassword = props.mustChangePassword;

    this.validate();
  }

  public static create(data: {
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    isActive?: boolean;
    mustChangePassword?: boolean;
  }): UserEntity {
    const now = new Date();

    return new UserEntity({
      id: UUID.generate().getValue(),
      email: Email.create(data.email),
      passwordHash: data.passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      isActive: data.isActive ?? true,
      mustChangePassword: data.mustChangePassword ?? true,
      createdAt: now,
      updatedAt: now,
    });
  }

  public static fromPrimitives(data: {
    id: string;
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    isActive: boolean;
    mustChangePassword: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): UserEntity {
    return new UserEntity({
      id: data.id,
      email: Email.create(data.email),
      passwordHash: data.passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      isActive: data.isActive,
      mustChangePassword: data.mustChangePassword,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }

  public getFullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  public getDisplayName(): string {
    return this.getFullName();
  }

  public activate(): UserEntity {
    if (this.isActive) {
      throw new DomainException('User is already active');
    }

    return new UserEntity({
      id: this.id,
      email: this.email,
      passwordHash: this.passwordHash,
      firstName: this.firstName,
      lastName: this.lastName,
      isActive: true,
      mustChangePassword: this.mustChangePassword,
      createdAt: this.createdAt,
      updatedAt: new Date(),
    });
  }

  public deactivate(): UserEntity {
    if (!this.isActive) {
      throw new DomainException('User is already inactive');
    }

    return new UserEntity({
      id: this.id,
      email: this.email,
      passwordHash: this.passwordHash,
      firstName: this.firstName,
      lastName: this.lastName,
      isActive: false,
      mustChangePassword: this.mustChangePassword,
      createdAt: this.createdAt,
      updatedAt: new Date(),
    });
  }

  public markPasswordChangeNotRequired(): UserEntity {
    if (!this.mustChangePassword) {
      throw new DomainException('User already does not need to change password');
    }

    return new UserEntity({
      id: this.id,
      email: this.email,
      passwordHash: this.passwordHash,
      firstName: this.firstName,
      lastName: this.lastName,
      isActive: this.isActive,
      mustChangePassword: false,
      createdAt: this.createdAt,
      updatedAt: new Date(),
    });
  }

  public updatePassword(newPasswordHash: string): UserEntity {
    if (!newPasswordHash) {
      throw new DomainException('Password hash cannot be empty');
    }

    return new UserEntity({
      id: this.id,
      email: this.email,
      passwordHash: newPasswordHash,
      firstName: this.firstName,
      lastName: this.lastName,
      isActive: this.isActive,
      mustChangePassword: false, // Password was just changed
      createdAt: this.createdAt,
      updatedAt: new Date(),
    });
  }

  public updateProfile(data: {
    firstName?: string;
    lastName?: string;
    email?: string;
  }): UserEntity {
    return new UserEntity({
      id: this.id,
      email: data.email ? Email.create(data.email) : this.email,
      passwordHash: this.passwordHash,
      firstName: data.firstName ?? this.firstName,
      lastName: data.lastName ?? this.lastName,
      isActive: this.isActive,
      mustChangePassword: this.mustChangePassword,
      createdAt: this.createdAt,
      updatedAt: new Date(),
    });
  }

  private validate(): void {
    if (!this.firstName || this.firstName.trim().length === 0) {
      throw new DomainException('First name cannot be empty');
    }

    if (!this.lastName || this.lastName.trim().length === 0) {
      throw new DomainException('Last name cannot be empty');
    }

    if (!this.passwordHash || this.passwordHash.trim().length === 0) {
      throw new DomainException('Password hash cannot be empty');
    }

    if (this.firstName.length > 50) {
      throw new DomainException('First name cannot be longer than 50 characters');
    }

    if (this.lastName.length > 50) {
      throw new DomainException('Last name cannot be longer than 50 characters');
    }
  }

  public toPrimitives(): {
    id: string;
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    isActive: boolean;
    mustChangePassword: boolean;
    createdAt: Date;
    updatedAt: Date;
  } {
    return {
      id: this.id,
      email: this.email.getValue(),
      passwordHash: this.passwordHash,
      firstName: this.firstName,
      lastName: this.lastName,
      isActive: this.isActive,
      mustChangePassword: this.mustChangePassword,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
