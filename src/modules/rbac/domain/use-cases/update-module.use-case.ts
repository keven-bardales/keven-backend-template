import { ModuleEntity } from '../entities/module.entity';

export interface UpdateModuleRequest {
  id: string;
  name?: string;
  description?: string | null;
  isActive?: boolean;
}

export interface UpdateModuleResponse {
  module: ModuleEntity;
}

export abstract class UpdateModuleUseCase {
  abstract execute(request: UpdateModuleRequest): Promise<UpdateModuleResponse>;
}
