import { BaseRepository } from '../../../../shared/domain/repositories/base.repository';
import { ModuleEntity } from '../entities/module.entity';

export interface CreateModuleData {
  name: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateModuleData {
  name?: string;
  description?: string;
  isActive?: boolean;
}

export abstract class ModuleRepository extends BaseRepository<
  ModuleEntity,
  CreateModuleData,
  UpdateModuleData
> {
  abstract findByName(name: string): Promise<ModuleEntity | null>;
  abstract findActiveModules(): Promise<ModuleEntity[]>;
  abstract findInactiveModules(): Promise<ModuleEntity[]>;
  abstract existsByName(name: string): Promise<boolean>;
  abstract findModulesWithPermissions(): Promise<ModuleEntity[]>;
  abstract countActiveModules(): Promise<number>;
  abstract countInactiveModules(): Promise<number>;
  abstract searchModules(
    searchTerm: string,
    options?: {
      skip?: number;
      take?: number;
      includeInactive?: boolean;
    }
  ): Promise<ModuleEntity[]>;
  abstract bulkUpdateStatus(moduleIds: string[], isActive: boolean): Promise<void>;
}
