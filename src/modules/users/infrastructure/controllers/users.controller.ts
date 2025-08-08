import { Request, Response, NextFunction } from 'express';
import { CreateUserUseCase } from '../../domain/use-cases/create-user.use-case';
import { GetUsersUseCase } from '../../domain/use-cases/get-users.use-case';
import { GetUserByIdUseCase } from '../../domain/use-cases/get-user-by-id.use-case';
import { UpdateUserUseCase } from '../../domain/use-cases/update-user.use-case';
import { DeleteUserUseCase } from '../../domain/use-cases/delete-user.use-case';
import { CreateUserDto } from '../../application/dto/create-user.dto';
import { UpdateUserDto } from '../../application/dto/update-user.dto';
import { GetUsersDto } from '../../application/dto/get-users.dto';
import { GetUserByIdDto } from '../../application/dto/get-user-by-id.dto';
import { UserResponseDto } from '../../application/dto/user-response.dto';
import { ApiResponse } from '../../../../shared/domain/wrappers/api-response.wrapper';
import { AuthenticatedRequest } from '../../../../shared/application/middleware/auth.middleware';

export class UsersController {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly getUsersUseCase: GetUsersUseCase,
    private readonly getUserByIdUseCase: GetUserByIdUseCase,
    private readonly updateUserUseCase: UpdateUserUseCase,
    private readonly deleteUserUseCase: DeleteUserUseCase
  ) {}

  public async createUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const createUserDto = new CreateUserDto(req.body);

      const result = await this.createUserUseCase.execute({
        email: createUserDto.email,
        password: createUserDto.password,
        firstName: createUserDto.firstName,
        lastName: createUserDto.lastName,
        isActive: createUserDto.isActive,
        mustChangePassword: createUserDto.mustChangePassword,
      });

      const userResponse = UserResponseDto.fromEntity(result.user);
      const response = ApiResponse.created(userResponse.toJSON(), 'User created successfully');

      res.status(response.statusCode).json(response.toJSON());
    } catch (error) {
      next(error);
    }
  }

  public async getUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const getUsersDto = new GetUsersDto(req.query);

      const result = await this.getUsersUseCase.execute({
        page: getUsersDto.page,
        limit: getUsersDto.limit,
        searchTerm: getUsersDto.searchTerm,
        includeInactive: getUsersDto.includeInactive,
        orderBy: getUsersDto.getOrderByObject(),
      });

      const usersResponse = UserResponseDto.fromEntities(result.result.data);
      const responseData = {
        data: usersResponse.map(user => user.toJSON()),
        meta: result.result.meta.toJSON(),
      };

      const response = ApiResponse.success(responseData, 'Users retrieved successfully');
      res.status(response.statusCode).json(response.toJSON());
    } catch (error) {
      next(error);
    }
  }

  public async getUserById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const getUserByIdDto = new GetUserByIdDto(req.params);

      const result = await this.getUserByIdUseCase.execute({
        id: getUserByIdDto.id,
      });

      const userResponse = UserResponseDto.fromEntity(result.user);
      const response = ApiResponse.success(userResponse.toJSON(), 'User retrieved successfully');

      res.status(response.statusCode).json(response.toJSON());
    } catch (error) {
      next(error);
    }
  }

  public async updateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const getUserByIdDto = new GetUserByIdDto(req.params);
      const updateUserDto = new UpdateUserDto(req.body);

      const result = await this.updateUserUseCase.execute({
        id: getUserByIdDto.id,
        email: updateUserDto.email,
        firstName: updateUserDto.firstName,
        lastName: updateUserDto.lastName,
        isActive: updateUserDto.isActive,
        mustChangePassword: updateUserDto.mustChangePassword,
      });

      const userResponse = UserResponseDto.fromEntity(result.user);
      const response = ApiResponse.success(userResponse.toJSON(), 'User updated successfully');

      res.status(response.statusCode).json(response.toJSON());
    } catch (error) {
      next(error);
    }
  }

  public async deleteUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const getUserByIdDto = new GetUserByIdDto(req.params);

      const result = await this.deleteUserUseCase.execute({
        id: getUserByIdDto.id,
      });

      const response = result.success
        ? ApiResponse.success(null, 'User deleted successfully')
        : ApiResponse.internalError('Failed to delete user');

      res.status(response.statusCode).json(response.toJSON());
    } catch (error) {
      next(error);
    }
  }

  // Additional controller methods for specific operations
  public async getCurrentUser(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        const response = ApiResponse.unauthorized('User not authenticated');
        res.status(response.statusCode).json(response.toJSON());
        return;
      }

      const result = await this.getUserByIdUseCase.execute({
        id: req.user.id,
      });

      const userResponse = UserResponseDto.fromEntity(result.user);
      const response = ApiResponse.success(
        userResponse.toJSON(),
        'Current user retrieved successfully'
      );

      res.status(response.statusCode).json(response.toJSON());
    } catch (error) {
      next(error);
    }
  }

  public async activateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const getUserByIdDto = new GetUserByIdDto(req.params);

      const result = await this.updateUserUseCase.execute({
        id: getUserByIdDto.id,
        isActive: true,
      });

      const userResponse = UserResponseDto.fromEntity(result.user);
      const response = ApiResponse.success(userResponse.toJSON(), 'User activated successfully');

      res.status(response.statusCode).json(response.toJSON());
    } catch (error) {
      next(error);
    }
  }

  public async deactivateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const getUserByIdDto = new GetUserByIdDto(req.params);

      const result = await this.updateUserUseCase.execute({
        id: getUserByIdDto.id,
        isActive: false,
      });

      const userResponse = UserResponseDto.fromEntity(result.user);
      const response = ApiResponse.success(userResponse.toJSON(), 'User deactivated successfully');

      res.status(response.statusCode).json(response.toJSON());
    } catch (error) {
      next(error);
    }
  }
}
