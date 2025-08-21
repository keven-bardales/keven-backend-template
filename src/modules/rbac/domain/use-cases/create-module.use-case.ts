import { ModuleEntity } from '../entities/module.entity';

export interface CreateModuleRequest {
  name: string;
  description?: string;
  isActive?: boolean;
}

export interface CreateModuleResponse {
  module: ModuleEntity;
}

export abstract class CreateModuleUseCase {
  abstract execute(request: CreateModuleRequest): Promise<CreateModuleResponse>;
}
