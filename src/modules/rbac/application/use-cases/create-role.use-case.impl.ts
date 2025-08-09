import {
  ConflictException,
  BadRequestException,
} from '../../../../shared/domain/exceptions/global-exceptions';
import {
  CreateRoleUseCase,
  CreateRoleRequest,
  CreateRoleResponse,
} from '../../domain/use-cases/create-role.use-case';
import { RoleRepository } from '../../domain/repositories/role.repository';

export class CreateRoleUseCaseImpl extends CreateRoleUseCase {
  constructor(private readonly roleRepository: RoleRepository) {
    super();
  }

  public async execute(request: CreateRoleRequest): Promise<CreateRoleResponse> {
    console.log('Creating new role', { name: request.name });

    try {
      // Validate input
      this.validateRequest(request);

      // Check if role already exists
      const existingRole = await this.roleRepository.findByName(request.name);
      if (existingRole) {
        console.log('Role creation failed: Role already exists', { name: request.name });
        throw new ConflictException('Role with this name already exists');
      }

      // Create role
      const role = await this.roleRepository.create({
        name: request.name,
        description: request.description,
        isSystem: request.isSystem || false,
      });

      console.log('Role created successfully', { roleId: role.id, name: role.name });

      return {
        id: role.id,
        name: role.name,
        description: role.description,
        isSystem: role.isSystem,
        createdAt: role.createdAt,
        updatedAt: role.updatedAt,
      };
    } catch (error) {
      console.log('Role creation failed', { name: request.name, error: (error as Error).message });
      throw error;
    }
  }

  private validateRequest(request: CreateRoleRequest): void {
    if (!request.name || request.name.trim().length === 0) {
      throw new BadRequestException('Role name is required');
    }

    if (request.name.length > 50) {
      throw new BadRequestException('Role name cannot exceed 50 characters');
    }

    if (request.description && request.description.length > 255) {
      throw new BadRequestException('Role description cannot exceed 255 characters');
    }
  }
}
