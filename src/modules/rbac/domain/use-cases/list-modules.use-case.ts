import { ModuleEntity } from '../entities/module.entity';

export interface ListModulesRequest {
  page: number;
  limit: number;
  search?: string;
  isActive?: boolean;
  sortBy: 'name' | 'createdAt' | 'updatedAt';
  sortOrder: 'asc' | 'desc';
}

export interface ListModulesResponse {
  modules: ModuleEntity[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export abstract class ListModulesUseCase {
  abstract execute(request: ListModulesRequest): Promise<ListModulesResponse>;
}
