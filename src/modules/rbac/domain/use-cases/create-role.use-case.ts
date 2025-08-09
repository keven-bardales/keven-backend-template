import { BaseUseCase } from '../../../../shared/domain/use-cases/base.use-case';

export interface CreateRoleRequest {
  name: string;
  description?: string;
  isSystem?: boolean;
}

export interface CreateRoleResponse {
  id: string;
  name: string;
  description?: string;
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export abstract class CreateRoleUseCase extends BaseUseCase<CreateRoleRequest, CreateRoleResponse> {
  abstract execute(request: CreateRoleRequest): Promise<CreateRoleResponse>;
}
