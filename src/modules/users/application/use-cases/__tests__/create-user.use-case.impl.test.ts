import { CreateUserUseCaseImpl } from '../create-user.use-case.impl';
import { UserRepository } from '../../../domain/repositories/user.repository';
import { PasswordService } from '../../../domain/services/password.service';
import { UserEntity } from '../../../domain/entities/user.entity';
import {
  ConflictException,
  BadRequestException,
  DomainException,
} from '../../../../../shared/domain/exceptions/global-exceptions';

describe('CreateUserUseCaseImpl', () => {
  let createUserUseCase: CreateUserUseCaseImpl;
  let mockUserRepository: jest.Mocked<UserRepository>;
  let mockPasswordService: jest.Mocked<PasswordService>;

  beforeEach(() => {
    mockUserRepository = {
      findByEmail: jest.fn(),
      create: jest.fn(),
    } as any;

    mockPasswordService = {
      hash: jest.fn(),
      getPasswordStrength: jest.fn(),
      isPasswordCompromised: jest.fn(),
    } as any;

    createUserUseCase = new CreateUserUseCaseImpl(mockUserRepository, mockPasswordService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const validRequest = {
      email: 'newuser@example.com',
      password: 'SecurePassword123!',
      firstName: 'Jane',
      lastName: 'Smith',
      isActive: true,
      mustChangePassword: false,
    };

    it('should create a new user successfully', async () => {
      // Arrange
      const hashedPassword = 'hashedSecurePassword123';
      const mockUser = {
        id: 'new-user-id',
        email: { getValue: () => 'newuser@example.com' },
        firstName: 'Jane',
        lastName: 'Smith',
        isActive: true,
        mustChangePassword: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as UserEntity;

      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockPasswordService.getPasswordStrength.mockReturnValue({
        score: 5,
        isValid: true,
        feedback: [],
      });
      mockPasswordService.isPasswordCompromised.mockResolvedValue(false);
      mockPasswordService.hash.mockResolvedValue(hashedPassword);
      mockUserRepository.create.mockResolvedValue(mockUser);

      // Act
      const result = await createUserUseCase.execute(validRequest);

      // Assert
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(validRequest.email);
      expect(mockPasswordService.getPasswordStrength).toHaveBeenCalledWith(validRequest.password);
      expect(mockPasswordService.isPasswordCompromised).toHaveBeenCalledWith(validRequest.password);
      expect(mockPasswordService.hash).toHaveBeenCalledWith(validRequest.password);
      expect(mockUserRepository.create).toHaveBeenCalledWith({
        email: validRequest.email,
        passwordHash: hashedPassword,
        firstName: validRequest.firstName,
        lastName: validRequest.lastName,
        isActive: validRequest.isActive,
        mustChangePassword: validRequest.mustChangePassword,
      });

      expect(result).toEqual({
        user: mockUser,
      });
    });

    it('should create user with default values when optional fields are not provided', async () => {
      // Arrange
      const minimalRequest = {
        email: 'minimal@example.com',
        password: 'SecurePassword123!',
        firstName: 'Min',
        lastName: 'User',
      };

      const hashedPassword = 'hashedPassword';
      const mockUser = {
        id: 'minimal-user-id',
        email: { getValue: () => 'minimal@example.com' },
        firstName: 'Min',
        lastName: 'User',
        isActive: true,
        mustChangePassword: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as UserEntity;

      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockPasswordService.getPasswordStrength.mockReturnValue({
        score: 5,
        isValid: true,
        feedback: [],
      });
      mockPasswordService.isPasswordCompromised.mockResolvedValue(false);
      mockPasswordService.hash.mockResolvedValue(hashedPassword);
      mockUserRepository.create.mockResolvedValue(mockUser);

      // Act
      const result = await createUserUseCase.execute(minimalRequest);

      // Assert
      expect(mockUserRepository.create).toHaveBeenCalledWith({
        email: minimalRequest.email,
        passwordHash: hashedPassword,
        firstName: minimalRequest.firstName,
        lastName: minimalRequest.lastName,
        isActive: undefined, // Will use entity defaults
        mustChangePassword: undefined, // Will use entity defaults
      });

      expect(result.user).toBe(mockUser);
    });

    it('should throw ConflictException if user with email already exists', async () => {
      // Arrange
      const existingUser = { id: 'existing-user-id' } as UserEntity;
      mockPasswordService.getPasswordStrength.mockReturnValue({
        score: 5,
        isValid: true,
        feedback: [],
      });
      mockPasswordService.isPasswordCompromised.mockResolvedValue(false);
      mockUserRepository.findByEmail.mockResolvedValue(existingUser);

      // Act & Assert
      await expect(createUserUseCase.execute(validRequest)).rejects.toThrow(ConflictException);
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(validRequest.email);
      expect(mockPasswordService.hash).not.toHaveBeenCalled();
      expect(mockUserRepository.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid email format', async () => {
      // Arrange
      const invalidRequest = { ...validRequest, email: 'invalid-email-format' };
      mockPasswordService.getPasswordStrength.mockReturnValue({
        score: 5,
        isValid: true,
        feedback: [],
      });
      mockPasswordService.isPasswordCompromised.mockResolvedValue(false);

      // Act & Assert
      await expect(createUserUseCase.execute(invalidRequest)).rejects.toThrow(
        'Invalid email format'
      );
    });

    it('should throw BadRequestException for empty email', async () => {
      // Arrange
      const invalidRequest = { ...validRequest, email: '' };
      mockPasswordService.getPasswordStrength.mockReturnValue({
        score: 5,
        isValid: true,
        feedback: [],
      });
      mockPasswordService.isPasswordCompromised.mockResolvedValue(false);

      // Act & Assert
      await expect(createUserUseCase.execute(invalidRequest)).rejects.toThrow(
        'Email cannot be empty'
      );
    });

    it('should throw BadRequestException for weak password', async () => {
      // Arrange
      const invalidRequest = { ...validRequest, password: '123' };
      mockPasswordService.getPasswordStrength.mockReturnValue({
        score: 5,
        isValid: true,
        feedback: [],
      });
      mockPasswordService.isPasswordCompromised.mockResolvedValue(false);

      // Act & Assert
      await expect(createUserUseCase.execute(invalidRequest)).rejects.toThrow(DomainException);
      expect(mockUserRepository.findByEmail).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for empty first name', async () => {
      // Arrange
      const invalidRequest = { ...validRequest, firstName: '   ' };
      mockPasswordService.getPasswordStrength.mockReturnValue({
        score: 5,
        isValid: true,
        feedback: [],
      });
      mockPasswordService.isPasswordCompromised.mockResolvedValue(false);
      mockUserRepository.findByEmail.mockResolvedValue(null);

      // Act & Assert
      await expect(createUserUseCase.execute(invalidRequest)).rejects.toThrow(Error);
    });

    it('should throw BadRequestException for empty last name', async () => {
      // Arrange
      const invalidRequest = { ...validRequest, lastName: '   ' };
      mockPasswordService.getPasswordStrength.mockReturnValue({
        score: 5,
        isValid: true,
        feedback: [],
      });
      mockPasswordService.isPasswordCompromised.mockResolvedValue(false);
      mockUserRepository.findByEmail.mockResolvedValue(null);

      // Act & Assert
      await expect(createUserUseCase.execute(invalidRequest)).rejects.toThrow(Error);
    });

    it('should handle password hashing failures', async () => {
      // Arrange
      const hashingError = new Error('Hashing service unavailable');
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockPasswordService.getPasswordStrength.mockReturnValue({
        score: 5,
        isValid: true,
        feedback: [],
      });
      mockPasswordService.isPasswordCompromised.mockResolvedValue(false);
      mockPasswordService.hash.mockRejectedValue(hashingError);

      // Act & Assert
      await expect(createUserUseCase.execute(validRequest)).rejects.toThrow(hashingError);
      expect(mockPasswordService.hash).toHaveBeenCalledWith(validRequest.password);
      expect(mockUserRepository.create).not.toHaveBeenCalled();
    });

    it('should handle user creation failures', async () => {
      // Arrange
      const creationError = new Error('Database constraint violation');
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockPasswordService.getPasswordStrength.mockReturnValue({
        score: 5,
        isValid: true,
        feedback: [],
      });
      mockPasswordService.isPasswordCompromised.mockResolvedValue(false);
      mockPasswordService.hash.mockResolvedValue('hashedPassword');
      mockUserRepository.create.mockRejectedValue(creationError);

      // Act & Assert
      await expect(createUserUseCase.execute(validRequest)).rejects.toThrow(creationError);
      expect(mockUserRepository.create).toHaveBeenCalled();
    });

    it('should handle repository findByEmail failures', async () => {
      // Arrange
      const repositoryError = new Error('Database connection timeout');
      mockPasswordService.getPasswordStrength.mockReturnValue({
        score: 5,
        isValid: true,
        feedback: [],
      });
      mockPasswordService.isPasswordCompromised.mockResolvedValue(false);
      mockUserRepository.findByEmail.mockRejectedValue(repositoryError);

      // Act & Assert
      await expect(createUserUseCase.execute(validRequest)).rejects.toThrow(
        'Database connection timeout'
      );
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(validRequest.email);
    });
  });
});
