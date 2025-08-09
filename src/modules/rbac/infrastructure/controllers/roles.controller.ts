import { Request, Response, NextFunction } from 'express';
import { CreateRoleUseCase } from '../../domain/use-cases/create-role.use-case';
import { ListRolesUseCase } from '../../domain/use-cases/list-roles.use-case';
import { RoleRepository } from '../../domain/repositories/role.repository';
import { CreateRoleDto } from '../../application/dto/create-role.dto';
import { UpdateRoleDto } from '../../application/dto/update-role.dto';
import { ListRolesDto } from '../../application/dto/list-roles.dto';
import { ApiResponse } from '../../../../shared/domain/wrappers/api-response.wrapper';
import { AuthenticatedRequest } from '../../../../shared/application/middleware/auth.middleware';
import { NotFoundException } from '../../../../shared/domain/exceptions/global-exceptions';

export class RolesController {
  constructor(
    private readonly createRoleUseCase: CreateRoleUseCase,
    private readonly listRolesUseCase: ListRolesUseCase,
    private readonly roleRepository: RoleRepository
  ) {}

  public async createRole(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const createRoleDto = new CreateRoleDto(req.body);

      const result = await this.createRoleUseCase.execute({
        name: createRoleDto.name,
        description: createRoleDto.description,
        isSystem: createRoleDto.isSystem,
      });

      const response = ApiResponse.success(result, 'Role created successfully');
      res.status(response.statusCode).json(response.toJSON());
    } catch (error) {
      next(error);
    }
  }

  public async listRoles(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const listRolesDto = new ListRolesDto(req.query);

      const result = await this.listRolesUseCase.execute({
        skip: listRolesDto.skip,
        take: listRolesDto.take,
        includeSystem: listRolesDto.includeSystem,
        searchTerm: listRolesDto.searchTerm,
      });

      const response = ApiResponse.success(result, 'Roles retrieved successfully');
      res.status(response.statusCode).json(response.toJSON());
    } catch (error) {
      next(error);
    }
  }

  public async getRoleById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const role = await this.roleRepository.findById(id);
      if (!role) {
        throw new NotFoundException(`Role with id '${id}' not found`);
      }

      const response = ApiResponse.success(role.toJSON(), 'Role retrieved successfully');
      res.status(response.statusCode).json(response.toJSON());
    } catch (error) {
      next(error);
    }
  }

  public async updateRole(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const updateRoleDto = new UpdateRoleDto(req.body);

      const updatedRole = await this.roleRepository.update(id, {
        name: updateRoleDto.name,
        description: updateRoleDto.description,
      });

      const response = ApiResponse.success(updatedRole.toJSON(), 'Role updated successfully');
      res.status(response.statusCode).json(response.toJSON());
    } catch (error) {
      next(error);
    }
  }

  public async deleteRole(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;

      await this.roleRepository.delete(id);

      const response = ApiResponse.success(null, 'Role deleted successfully');
      res.status(response.statusCode).json(response.toJSON());
    } catch (error) {
      next(error);
    }
  }

  public async assignPermissionToRole(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { roleId, permissionId } = req.params;

      await this.roleRepository.assignPermissionToRole(roleId, permissionId);

      const response = ApiResponse.success(null, 'Permission assigned to role successfully');
      res.status(response.statusCode).json(response.toJSON());
    } catch (error) {
      next(error);
    }
  }

  public async removePermissionFromRole(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { roleId, permissionId } = req.params;

      await this.roleRepository.removePermissionFromRole(roleId, permissionId);

      const response = ApiResponse.success(null, 'Permission removed from role successfully');
      res.status(response.statusCode).json(response.toJSON());
    } catch (error) {
      next(error);
    }
  }

  public async getRolePermissions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { roleId } = req.params;

      const permissionIds = await this.roleRepository.getRolePermissions(roleId);

      const response = ApiResponse.success(
        { permissionIds },
        'Role permissions retrieved successfully'
      );
      res.status(response.statusCode).json(response.toJSON());
    } catch (error) {
      next(error);
    }
  }

  public async assignRoleToUser(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { userId, roleId } = req.params;

      await this.roleRepository.assignRoleToUser(userId, roleId);

      const response = ApiResponse.success(null, 'Role assigned to user successfully');
      res.status(response.statusCode).json(response.toJSON());
    } catch (error) {
      next(error);
    }
  }

  public async removeRoleFromUser(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { userId, roleId } = req.params;

      await this.roleRepository.removeRoleFromUser(userId, roleId);

      const response = ApiResponse.success(null, 'Role removed from user successfully');
      res.status(response.statusCode).json(response.toJSON());
    } catch (error) {
      next(error);
    }
  }

  public async getUserRoles(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;

      const roles = await this.roleRepository.findRolesByUserId(userId);

      const response = ApiResponse.success(
        { roles: roles.map(role => role.toJSON()) },
        'User roles retrieved successfully'
      );
      res.status(response.statusCode).json(response.toJSON());
    } catch (error) {
      next(error);
    }
  }
}
