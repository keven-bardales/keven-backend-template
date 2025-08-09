import { BadRequestException } from '../../../../shared/domain/exceptions/global-exceptions';

export class RegisterDto {
  public readonly email: string;
  public readonly password: string;
  public readonly firstName: string;
  public readonly lastName: string;

  constructor(data: any) {
    this.email = data?.email?.trim()?.toLowerCase();
    this.password = data?.password;
    this.firstName = data?.firstName?.trim();
    this.lastName = data?.lastName?.trim();

    this.validate();
  }

  private validate(): void {
    if (!this.email) {
      throw new BadRequestException('Email is required');
    }

    if (!this.email.includes('@')) {
      throw new BadRequestException('Valid email is required');
    }

    if (!this.password) {
      throw new BadRequestException('Password is required');
    }

    if (this.password.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters long');
    }

    if (!this.firstName) {
      throw new BadRequestException('First name is required');
    }

    if (!this.lastName) {
      throw new BadRequestException('Last name is required');
    }
  }
}
