import {
  GetUsersUseCase,
  GetUsersRequest,
  GetUsersResponse,
} from '../../domain/use-cases/get-users.use-case';
import { UserRepository } from '../../domain/repositories/user.repository';
import {
  PaginatedResult,
  PaginationHelper,
} from '../../../../shared/domain/wrappers/pagination-wrapper';
import { UserEntity } from '../../domain/entities/user.entity';

export class GetUsersUseCaseImpl extends GetUsersUseCase {
  constructor(private readonly userRepository: UserRepository) {
    super();
  }

  public async execute(request: GetUsersRequest): Promise<GetUsersResponse> {
    this.log('Getting users', request);

    try {
      // Validate and normalize pagination options
      const paginationOptions = PaginationHelper.validateOptions({
        page: request.page,
        limit: request.limit,
        orderBy: request.orderBy,
      });

      const { skip, take } = PaginationHelper.getSkipTake(
        paginationOptions.page,
        paginationOptions.limit
      );

      let users: UserEntity[];
      let totalCount: number;

      if (request.searchTerm) {
        // Search users by term
        users = await this.userRepository.searchUsers(request.searchTerm, {
          skip,
          take,
          includeInactive: request.includeInactive,
        });

        // Get total count for search
        const allSearchResults = await this.userRepository.searchUsers(request.searchTerm, {
          includeInactive: request.includeInactive,
        });
        totalCount = allSearchResults.length;
      } else {
        // Get all users with filters
        const whereConditions: Record<string, any> = {};

        if (!request.includeInactive) {
          whereConditions.isActive = true;
        }

        users = await this.userRepository.findAll({
          skip,
          take,
          orderBy: paginationOptions.orderBy,
          where: whereConditions,
        });

        totalCount = await this.userRepository.count(whereConditions);
      }

      // Create paginated result
      const result = PaginatedResult.create(
        users,
        paginationOptions.page,
        paginationOptions.limit,
        totalCount
      );

      this.log('Users retrieved successfully', {
        count: users.length,
        totalCount,
        page: paginationOptions.page,
      });

      return { result };
    } catch (error) {
      this.logError('Failed to get users', error);
      throw error;
    }
  }
}
