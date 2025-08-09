import { CreateRoleUseCaseImpl } from '../create-role.use-case.impl';
import { RoleRepository } from '../../../domain/repositories/role.repository';
import { RoleEntity } from '../../../domain/entities/role.entity';
import {
  ConflictException,
  BadRequestException,
} from '../../../../../shared/domain/exceptions/global-exceptions';

describe('CreateRoleUseCaseImpl', () => {
  let createRoleUseCase: CreateRoleUseCaseImpl;
  let mockRoleRepository: jest.Mocked<RoleRepository>;

  beforeEach(() => {
    mockRoleRepository = {
      findByName: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findAll: jest.fn(),
      exists: jest.fn(),
      count: jest.fn(),
      findSystemRoles: jest.fn(),
      findNonSystemRoles: jest.fn(),
      existsByName: jest.fn(),
      findRolesWithPermissions: jest.fn(),
      assignPermissionToRole: jest.fn(),
      removePermissionFromRole: jest.fn(),
      getRolePermissions: jest.fn(),
      findRolesByUserId: jest.fn(),
      assignRoleToUser: jest.fn(),
      removeRoleFromUser: jest.fn(),
      getUserRoles: jest.fn(),
      bulkAssignRolesToUser: jest.fn(),
      bulkRemoveRolesFromUser: jest.fn(),
    } as jest.Mocked<RoleRepository>;

    createRoleUseCase = new CreateRoleUseCaseImpl(mockRoleRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const validRequest = {
      name: 'Test Role',
      description: 'A test role',
      isSystem: false,
    };

    it('should create a new role successfully', async () => {
      // Arrange
      const mockRole = {
        id: 'role-id',
        name: 'Test Role',
        description: 'A test role',
        isSystem: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as RoleEntity;

      mockRoleRepository.findByName.mockResolvedValue(null);
      mockRoleRepository.create.mockResolvedValue(mockRole);

      // Act
      const result = await createRoleUseCase.execute(validRequest);

      // Assert
      expect(mockRoleRepository.findByName).toHaveBeenCalledWith(validRequest.name);
      expect(mockRoleRepository.create).toHaveBeenCalledWith({
        name: validRequest.name,
        description: validRequest.description,
        isSystem: validRequest.isSystem,
      });

      expect(result).toEqual({
        id: mockRole.id,
        name: mockRole.name,
        description: mockRole.description,
        isSystem: mockRole.isSystem,
        createdAt: mockRole.createdAt,
        updatedAt: mockRole.updatedAt,
      });
    });

    it('should create a role without description', async () => {
      // Arrange
      const requestWithoutDescription = {
        name: 'Test Role',
        isSystem: false,
      };

      const mockRole = {
        id: 'role-id',
        name: 'Test Role',
        description: undefined,
        isSystem: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as RoleEntity;

      mockRoleRepository.findByName.mockResolvedValue(null);
      mockRoleRepository.create.mockResolvedValue(mockRole);

      // Act
      const result = await createRoleUseCase.execute(requestWithoutDescription);

      // Assert
      expect(mockRoleRepository.create).toHaveBeenCalledWith({
        name: requestWithoutDescription.name,
        description: undefined,
        isSystem: requestWithoutDescription.isSystem,
      });

      expect(result).toEqual({
        id: mockRole.id,
        name: mockRole.name,
        description: mockRole.description,
        isSystem: mockRole.isSystem,
        createdAt: mockRole.createdAt,
        updatedAt: mockRole.updatedAt,
      });
    });

    it('should throw ConflictException if role name already exists', async () => {
      // Arrange
      const existingRole = { id: 'existing-id', name: 'Test Role' } as RoleEntity;
      mockRoleRepository.findByName.mockResolvedValue(existingRole);

      // Act & Assert
      await expect(createRoleUseCase.execute(validRequest)).rejects.toThrow(ConflictException);
      expect(mockRoleRepository.findByName).toHaveBeenCalledWith(validRequest.name);
      expect(mockRoleRepository.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for empty role name', async () => {
      // Arrange
      const invalidRequest = { ...validRequest, name: '' };

      // Act & Assert
      await expect(createRoleUseCase.execute(invalidRequest)).rejects.toThrow(BadRequestException);
      expect(mockRoleRepository.findByName).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for role name exceeding 50 characters', async () => {
      // Arrange
      const invalidRequest = {
        ...validRequest,
        name: 'a'.repeat(51), // 51 characters
      };

      // Act & Assert
      await expect(createRoleUseCase.execute(invalidRequest)).rejects.toThrow(BadRequestException);
      expect(mockRoleRepository.findByName).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for description exceeding 255 characters', async () => {
      // Arrange
      const invalidRequest = {
        ...validRequest,
        description: 'a'.repeat(256), // 256 characters
      };

      // Act & Assert
      await expect(createRoleUseCase.execute(invalidRequest)).rejects.toThrow(BadRequestException);
      expect(mockRoleRepository.findByName).not.toHaveBeenCalled();
    });

    it('should default isSystem to false when not provided', async () => {
      // Arrange
      const requestWithoutIsSystem = {
        name: 'Test Role',
        description: 'A test role',
      };

      const mockRole = {
        id: 'role-id',
        name: 'Test Role',
        description: 'A test role',
        isSystem: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as RoleEntity;

      mockRoleRepository.findByName.mockResolvedValue(null);
      mockRoleRepository.create.mockResolvedValue(mockRole);

      // Act
      await createRoleUseCase.execute(requestWithoutIsSystem);

      // Assert
      expect(mockRoleRepository.create).toHaveBeenCalledWith({
        name: requestWithoutIsSystem.name,
        description: requestWithoutIsSystem.description,
        isSystem: false,
      });
    });

    it('should handle repository errors', async () => {
      // Arrange
      const repositoryError = new Error('Database connection failed');
      mockRoleRepository.findByName.mockRejectedValue(repositoryError);

      // Act & Assert
      await expect(createRoleUseCase.execute(validRequest)).rejects.toThrow(repositoryError);
      expect(mockRoleRepository.findByName).toHaveBeenCalledWith(validRequest.name);
    });

    it('should handle role creation errors', async () => {
      // Arrange
      const creationError = new Error('Role creation failed');
      mockRoleRepository.findByName.mockResolvedValue(null);
      mockRoleRepository.create.mockRejectedValue(creationError);

      // Act & Assert
      await expect(createRoleUseCase.execute(validRequest)).rejects.toThrow(creationError);
      expect(mockRoleRepository.create).toHaveBeenCalled();
    });
  });
});
