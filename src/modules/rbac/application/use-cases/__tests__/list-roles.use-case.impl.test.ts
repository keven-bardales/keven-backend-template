import { ListRolesUseCaseImpl } from '../list-roles.use-case.impl';
import { RoleRepository } from '../../../domain/repositories/role.repository';
import { RoleEntity } from '../../../domain/entities/role.entity';

describe('ListRolesUseCaseImpl', () => {
  let listRolesUseCase: ListRolesUseCaseImpl;
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

    listRolesUseCase = new ListRolesUseCaseImpl(mockRoleRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const mockRoles: RoleEntity[] = [
      {
        id: '1',
        name: 'Admin',
        description: 'Administrator role',
        isSystem: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      } as RoleEntity,
      {
        id: '2',
        name: 'User',
        description: 'Regular user role',
        isSystem: false,
        createdAt: new Date('2024-01-02'),
        updatedAt: new Date('2024-01-02'),
      } as RoleEntity,
    ];

    it('should list all roles with default pagination', async () => {
      // Arrange
      const request = {};
      mockRoleRepository.findAll.mockResolvedValue(mockRoles);
      mockRoleRepository.count.mockResolvedValue(2);

      // Act
      const result = await listRolesUseCase.execute(request);

      // Assert
      expect(mockRoleRepository.findAll).toHaveBeenCalledWith({
        skip: 0,
        take: 20,
      });
      expect(mockRoleRepository.count).toHaveBeenCalled();

      expect(result).toEqual({
        roles: mockRoles.map(role => ({
          id: role.id,
          name: role.name,
          description: role.description,
          isSystem: role.isSystem,
          createdAt: role.createdAt,
          updatedAt: role.updatedAt,
        })),
        total: 2,
        skip: 0,
        take: 20,
      });
    });

    it('should list roles with custom pagination', async () => {
      // Arrange
      const request = { skip: 10, take: 5 };
      mockRoleRepository.findAll.mockResolvedValue([mockRoles[1]]);
      mockRoleRepository.count.mockResolvedValue(2);

      // Act
      const result = await listRolesUseCase.execute(request);

      // Assert
      expect(mockRoleRepository.findAll).toHaveBeenCalledWith({
        skip: 10,
        take: 5,
      });

      expect(result).toEqual({
        roles: [
          {
            id: mockRoles[1].id,
            name: mockRoles[1].name,
            description: mockRoles[1].description,
            isSystem: mockRoles[1].isSystem,
            createdAt: mockRoles[1].createdAt,
            updatedAt: mockRoles[1].updatedAt,
          },
        ],
        total: 2,
        skip: 10,
        take: 5,
      });
    });

    it('should list only system roles when includeSystem is true', async () => {
      // Arrange
      const request = { includeSystem: true };
      const systemRoles = [mockRoles[0]]; // Only Admin role
      mockRoleRepository.findSystemRoles.mockResolvedValue(systemRoles);
      mockRoleRepository.count.mockResolvedValue(2);

      // Act
      const result = await listRolesUseCase.execute(request);

      // Assert
      expect(mockRoleRepository.findSystemRoles).toHaveBeenCalled();
      expect(mockRoleRepository.findAll).not.toHaveBeenCalled();

      expect(result.roles).toHaveLength(1);
      expect(result.roles[0].name).toBe('Admin');
      expect(result.roles[0].isSystem).toBe(true);
    });

    it('should list only non-system roles when includeSystem is false', async () => {
      // Arrange
      const request = { includeSystem: false };
      const nonSystemRoles = [mockRoles[1]]; // Only User role
      mockRoleRepository.findNonSystemRoles.mockResolvedValue(nonSystemRoles);
      mockRoleRepository.count.mockResolvedValue(2);

      // Act
      const result = await listRolesUseCase.execute(request);

      // Assert
      expect(mockRoleRepository.findNonSystemRoles).toHaveBeenCalled();
      expect(mockRoleRepository.findAll).not.toHaveBeenCalled();

      expect(result.roles).toHaveLength(1);
      expect(result.roles[0].name).toBe('User');
      expect(result.roles[0].isSystem).toBe(false);
    });

    it('should filter roles by search term', async () => {
      // Arrange
      const request = { searchTerm: 'admin' };
      mockRoleRepository.findAll.mockResolvedValue(mockRoles);
      mockRoleRepository.count.mockResolvedValue(2);

      // Act
      const result = await listRolesUseCase.execute(request);

      // Assert
      expect(result.roles).toHaveLength(1);
      expect(result.roles[0].name).toBe('Admin');
    });

    it('should filter roles by search term in description', async () => {
      // Arrange
      const request = { searchTerm: 'administrator' };
      mockRoleRepository.findAll.mockResolvedValue(mockRoles);
      mockRoleRepository.count.mockResolvedValue(2);

      // Act
      const result = await listRolesUseCase.execute(request);

      // Assert
      expect(result.roles).toHaveLength(1);
      expect(result.roles[0].name).toBe('Admin');
    });

    it('should return empty array when search term matches no roles', async () => {
      // Arrange
      const request = { searchTerm: 'nonexistent' };
      mockRoleRepository.findAll.mockResolvedValue(mockRoles);
      mockRoleRepository.count.mockResolvedValue(2);

      // Act
      const result = await listRolesUseCase.execute(request);

      // Assert
      expect(result.roles).toHaveLength(0);
    });

    it('should handle case-insensitive search', async () => {
      // Arrange
      const request = { searchTerm: 'ADMIN' };
      mockRoleRepository.findAll.mockResolvedValue(mockRoles);
      mockRoleRepository.count.mockResolvedValue(2);

      // Act
      const result = await listRolesUseCase.execute(request);

      // Assert
      expect(result.roles).toHaveLength(1);
      expect(result.roles[0].name).toBe('Admin');
    });

    it('should apply pagination after search filtering for system/non-system roles', async () => {
      // Arrange
      const request = { includeSystem: false, searchTerm: 'user', skip: 0, take: 1 };
      const manyUserRoles = [
        { ...mockRoles[1], name: 'User1' },
        { ...mockRoles[1], name: 'User2' },
      ] as RoleEntity[];

      mockRoleRepository.findNonSystemRoles.mockResolvedValue(manyUserRoles);
      mockRoleRepository.count.mockResolvedValue(2);

      // Act
      const result = await listRolesUseCase.execute(request);

      // Assert
      expect(result.roles).toHaveLength(1); // Should only return 1 due to take: 1
      expect(result.skip).toBe(0);
      expect(result.take).toBe(1);
    });

    it('should handle repository errors', async () => {
      // Arrange
      const repositoryError = new Error('Database connection failed');
      mockRoleRepository.findAll.mockRejectedValue(repositoryError);

      // Act & Assert
      await expect(listRolesUseCase.execute({})).rejects.toThrow(repositoryError);
    });

    it('should handle count errors', async () => {
      // Arrange
      const countError = new Error('Count query failed');
      mockRoleRepository.findAll.mockResolvedValue(mockRoles);
      mockRoleRepository.count.mockRejectedValue(countError);

      // Act & Assert
      await expect(listRolesUseCase.execute({})).rejects.toThrow(countError);
    });
  });
});
