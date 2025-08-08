import { BaseUseCase } from '../../../../shared/domain/use-cases/base.use-case';
import { UserEntity } from '../entities/user.entity';

export interface UpdateUserRequest {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  isActive?: boolean;
  mustChangePassword?: boolean;
}

export interface UpdateUserResponse {
  user: UserEntity;
}

export abstract class UpdateUserUseCase extends BaseUseCase<UpdateUserRequest, UpdateUserResponse> {
  abstract execute(request: UpdateUserRequest): Promise<UpdateUserResponse>;
}
