import { RegisterUseCaseImpl } from '../register.use-case.impl';
import { UserRepository } from '../../../../users/domain/repositories/user.repository';
import { PasswordService } from '../../../../users/domain/services/password.service';
import { UserEntity } from '../../../../users/domain/entities/user.entity';
import {
  ConflictException,
  BadRequestException,
} from '../../../../../shared/domain/exceptions/global-exceptions';

describe('RegisterUseCaseImpl', () => {
  let registerUseCase: RegisterUseCaseImpl;
  let mockUserRepository: jest.Mocked<UserRepository>;
  let mockPasswordService: jest.Mocked<PasswordService>;

  beforeEach(() => {
    // Create mocks
    mockUserRepository = {
      findByEmail: jest.fn(),
      create: jest.fn(),
    } as any;

    mockPasswordService = {
      hash: jest.fn(),
    } as any;

    registerUseCase = new RegisterUseCaseImpl(mockUserRepository, mockPasswordService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const validRequest = {
      email: 'test@example.com',
      password: 'Password123!',
      firstName: 'John',
      lastName: 'Doe',
    };

    it('should register a new user successfully', async () => {
      // Arrange
      const hashedPassword = 'hashedPassword123';
      const mockUser = {
        id: 'user-id',
        email: { getValue: () => 'test@example.com' },
        firstName: 'John',
        lastName: 'Doe',
        isActive: true,
        mustChangePassword: false,
        createdAt: new Date(),
      } as UserEntity;

      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockPasswordService.hash.mockResolvedValue(hashedPassword);
      mockUserRepository.create.mockResolvedValue(mockUser);

      // Act
      const result = await registerUseCase.execute(validRequest);

      // Assert
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(validRequest.email);
      expect(mockPasswordService.hash).toHaveBeenCalledWith(validRequest.password);
      expect(mockUserRepository.create).toHaveBeenCalledWith({
        email: validRequest.email,
        passwordHash: hashedPassword,
        firstName: validRequest.firstName,
        lastName: validRequest.lastName,
        isActive: true,
        mustChangePassword: false,
      });

      expect(result).toEqual({
        id: mockUser.id,
        email: 'test@example.com',
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
        isActive: mockUser.isActive,
        mustChangePassword: mockUser.mustChangePassword,
        createdAt: mockUser.createdAt,
      });
    });

    it('should throw ConflictException if user already exists', async () => {
      // Arrange
      const existingUser = { id: 'existing-id' } as UserEntity;
      mockUserRepository.findByEmail.mockResolvedValue(existingUser);

      // Act & Assert
      await expect(registerUseCase.execute(validRequest)).rejects.toThrow(ConflictException);
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(validRequest.email);
      expect(mockPasswordService.hash).not.toHaveBeenCalled();
      expect(mockUserRepository.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid email', async () => {
      // Arrange
      const invalidRequest = { ...validRequest, email: 'invalid-email' };

      // Act & Assert
      await expect(registerUseCase.execute(invalidRequest)).rejects.toThrow(BadRequestException);
      expect(mockUserRepository.findByEmail).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for short password', async () => {
      // Arrange
      const invalidRequest = { ...validRequest, password: '123' };

      // Act & Assert
      await expect(registerUseCase.execute(invalidRequest)).rejects.toThrow(BadRequestException);
      expect(mockUserRepository.findByEmail).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for empty first name', async () => {
      // Arrange
      const invalidRequest = { ...validRequest, firstName: '' };

      // Act & Assert
      await expect(registerUseCase.execute(invalidRequest)).rejects.toThrow(BadRequestException);
      expect(mockUserRepository.findByEmail).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for empty last name', async () => {
      // Arrange
      const invalidRequest = { ...validRequest, lastName: '' };

      // Act & Assert
      await expect(registerUseCase.execute(invalidRequest)).rejects.toThrow(BadRequestException);
      expect(mockUserRepository.findByEmail).not.toHaveBeenCalled();
    });

    it('should handle repository errors', async () => {
      // Arrange
      const repositoryError = new Error('Database connection failed');
      mockUserRepository.findByEmail.mockRejectedValue(repositoryError);

      // Act & Assert
      await expect(registerUseCase.execute(validRequest)).rejects.toThrow(repositoryError);
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(validRequest.email);
    });

    it('should handle password hashing errors', async () => {
      // Arrange
      const hashingError = new Error('Password hashing failed');
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockPasswordService.hash.mockRejectedValue(hashingError);

      // Act & Assert
      await expect(registerUseCase.execute(validRequest)).rejects.toThrow(hashingError);
      expect(mockPasswordService.hash).toHaveBeenCalledWith(validRequest.password);
    });

    it('should handle user creation errors', async () => {
      // Arrange
      const creationError = new Error('User creation failed');
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockPasswordService.hash.mockResolvedValue('hashedPassword');
      mockUserRepository.create.mockRejectedValue(creationError);

      // Act & Assert
      await expect(registerUseCase.execute(validRequest)).rejects.toThrow(creationError);
      expect(mockUserRepository.create).toHaveBeenCalled();
    });
  });
});
