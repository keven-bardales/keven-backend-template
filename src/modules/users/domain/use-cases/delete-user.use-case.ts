import { BaseUseCase } from '../../../../shared/domain/use-cases/base.use-case';

export interface DeleteUserRequest {
  id: string;
}

export interface DeleteUserResponse {
  success: boolean;
}

export abstract class DeleteUserUseCase extends BaseUseCase<DeleteUserRequest, DeleteUserResponse> {
  abstract execute(request: DeleteUserRequest): Promise<DeleteUserResponse>;
}
