import {
  ListRolesUseCase,
  ListRolesRequest,
  ListRolesResponse,
} from '../../domain/use-cases/list-roles.use-case';
import { RoleRepository } from '../../domain/repositories/role.repository';

export class ListRolesUseCaseImpl extends ListRolesUseCase {
  constructor(private readonly roleRepository: RoleRepository) {
    super();
  }

  public async execute(request: ListRolesRequest): Promise<ListRolesResponse> {
    console.log('Listing roles', {
      skip: request.skip,
      take: request.take,
      includeSystem: request.includeSystem,
      searchTerm: request.searchTerm,
    });

    try {
      const skip = request.skip || 0;
      const take = request.take || 20;

      // Get roles based on filters
      let roles;
      if (request.includeSystem === false) {
        roles = await this.roleRepository.findNonSystemRoles();
      } else if (request.includeSystem === true) {
        roles = await this.roleRepository.findSystemRoles();
      } else {
        roles = await this.roleRepository.findAll({
          skip,
          take,
        });
      }

      // Apply search filter if provided
      if (request.searchTerm) {
        const searchLower = request.searchTerm.toLowerCase();
        roles = roles.filter(
          role =>
            role.name.toLowerCase().includes(searchLower) ||
            (role.description && role.description.toLowerCase().includes(searchLower))
        );
      }

      // Apply pagination if not already applied
      if (request.includeSystem !== undefined) {
        const totalRoles = roles.length;
        roles = roles.slice(skip, skip + take);
      }

      const total = await this.roleRepository.count();

      console.log('Roles listed successfully', { count: roles.length, total });

      return {
        roles: roles.map(role => ({
          id: role.id,
          name: role.name,
          description: role.description,
          isSystem: role.isSystem,
          createdAt: role.createdAt,
          updatedAt: role.updatedAt,
        })),
        total,
        skip,
        take,
      };
    } catch (error) {
      console.log('Failed to list roles', { error: (error as Error).message });
      throw error;
    }
  }
}
