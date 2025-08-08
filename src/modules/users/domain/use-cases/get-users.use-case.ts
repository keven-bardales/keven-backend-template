import { BaseUseCase } from '../../../../shared/domain/use-cases/base.use-case';
import { PaginatedResult } from '../../../../shared/domain/wrappers/pagination-wrapper';
import { UserEntity } from '../entities/user.entity';

export interface GetUsersRequest {
  page?: number;
  limit?: number;
  searchTerm?: string;
  includeInactive?: boolean;
  orderBy?: Record<string, 'asc' | 'desc'>;
}

export interface GetUsersResponse {
  result: PaginatedResult<UserEntity>;
}

export abstract class GetUsersUseCase extends BaseUseCase<GetUsersRequest, GetUsersResponse> {
  abstract execute(request: GetUsersRequest): Promise<GetUsersResponse>;
}
