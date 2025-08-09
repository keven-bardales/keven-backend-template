import { BaseUseCase } from '../../../../shared/domain/use-cases/base.use-case';

export interface ListRolesRequest {
  skip?: number;
  take?: number;
  includeSystem?: boolean;
  searchTerm?: string;
}

export interface RoleListItem {
  id: string;
  name: string;
  description?: string;
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ListRolesResponse {
  roles: RoleListItem[];
  total: number;
  skip: number;
  take: number;
}

export abstract class ListRolesUseCase extends BaseUseCase<ListRolesRequest, ListRolesResponse> {
  abstract execute(request: ListRolesRequest): Promise<ListRolesResponse>;
}
