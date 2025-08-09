import {
  ConflictException,
  BadRequestException,
} from '../../../../shared/domain/exceptions/global-exceptions';
import {
  RegisterUseCase,
  RegisterRequest,
  RegisterResponse,
} from '../../domain/use-cases/register.use-case';
import { UserRepository } from '../../../users/domain/repositories/user.repository';
import { PasswordService } from '../../../users/domain/services/password.service';
import { UserEntity } from '../../../users/domain/entities/user.entity';

export class RegisterUseCaseImpl extends RegisterUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordService: PasswordService
  ) {
    super();
  }

  public async execute(request: RegisterRequest): Promise<RegisterResponse> {
    console.log('User attempting to register', { email: request.email });

    try {
      // Validate input
      this.validateRequest(request);

      // Check if user already exists
      const existingUser = await this.userRepository.findByEmail(request.email);
      if (existingUser) {
        console.log('Registration failed: User already exists', { email: request.email });
        throw new ConflictException('User with this email already exists');
      }

      // Hash password
      const passwordHash = await this.passwordService.hash(request.password);

      // Save user using repository interface
      const savedUser = await this.userRepository.create({
        email: request.email,
        passwordHash,
        firstName: request.firstName,
        lastName: request.lastName,
        isActive: true,
        mustChangePassword: false,
      });

      console.log('User registered successfully', {
        userId: savedUser.id,
        email: savedUser.email.getValue(),
      });

      return {
        id: savedUser.id,
        email: savedUser.email.getValue(),
        firstName: savedUser.firstName,
        lastName: savedUser.lastName,
        isActive: savedUser.isActive,
        mustChangePassword: savedUser.mustChangePassword,
        createdAt: savedUser.createdAt,
      };
    } catch (error) {
      console.log('Registration failed', { email: request.email, error: (error as Error).message });
      throw error;
    }
  }

  private validateRequest(request: RegisterRequest): void {
    if (!request.email || !request.email.includes('@')) {
      throw new BadRequestException('Valid email is required');
    }

    if (!request.password || request.password.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters long');
    }

    if (!request.firstName || request.firstName.trim().length === 0) {
      throw new BadRequestException('First name is required');
    }

    if (!request.lastName || request.lastName.trim().length === 0) {
      throw new BadRequestException('Last name is required');
    }
  }
}
