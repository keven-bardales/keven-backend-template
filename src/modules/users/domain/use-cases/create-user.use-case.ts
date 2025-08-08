import { BaseUseCase } from '../../../../shared/domain/use-cases/base.use-case';
import { UserEntity } from '../entities/user.entity';

export interface CreateUserRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  isActive?: boolean;
  mustChangePassword?: boolean;
}

export interface CreateUserResponse {
  user: UserEntity;
}

export abstract class CreateUserUseCase extends BaseUseCase<CreateUserRequest, CreateUserResponse> {
  abstract execute(request: CreateUserRequest): Promise<CreateUserResponse>;
}
