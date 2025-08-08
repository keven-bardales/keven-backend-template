import {
  ConflictException,
  DomainException,
} from '../../../../shared/domain/exceptions/global-exceptions';
import {
  CreateUserUseCase,
  CreateUserRequest,
  CreateUserResponse,
} from '../../domain/use-cases/create-user.use-case';
import { UserRepository } from '../../domain/repositories/user.repository';
import { PasswordService } from '../../domain/services/password.service';
import { UserEntity } from '../../domain/entities/user.entity';
import { Password } from '../../../../shared/domain/value-objects/password.value-object';

export class CreateUserUseCaseImpl extends CreateUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordService: PasswordService
  ) {
    super();
  }

  public async execute(request: CreateUserRequest): Promise<CreateUserResponse> {
    this.log('Creating new user', { email: request.email });

    try {
      // Validate password strength
      await this.validatePassword(request.password);

      // Check if user already exists
      await this.ensureUserDoesNotExist(request.email);

      // Hash the password
      const passwordHash = await this.passwordService.hash(request.password);

      // Create user entity
      const user = UserEntity.create({
        email: request.email,
        passwordHash,
        firstName: request.firstName,
        lastName: request.lastName,
        isActive: request.isActive,
        mustChangePassword: request.mustChangePassword,
      });

      // Save to repository
      const savedUser = await this.userRepository.create({
        email: request.email,
        passwordHash,
        firstName: request.firstName,
        lastName: request.lastName,
        isActive: request.isActive,
        mustChangePassword: request.mustChangePassword,
      });

      this.log('User created successfully', { userId: savedUser.id });

      return { user: savedUser };
    } catch (error) {
      this.logError('Failed to create user', error);
      throw error;
    }
  }

  private async validatePassword(password: string): Promise<void> {
    try {
      // Validate with Password value object
      Password.create(password);

      // Check password strength using service
      const strengthResult = this.passwordService.getPasswordStrength(password);

      if (!strengthResult.isValid) {
        throw new DomainException(
          `Password validation failed: ${strengthResult.feedback.join(', ')}`
        );
      }

      // Check if password is compromised (optional)
      const isCompromised = await this.passwordService.isPasswordCompromised(password);
      if (isCompromised) {
        throw new DomainException('Password has been found in data breaches and cannot be used');
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new DomainException(error.message);
      }
      throw error;
    }
  }

  private async ensureUserDoesNotExist(email: string): Promise<void> {
    const existingUser = await this.userRepository.findByEmail(email);

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }
  }
}
