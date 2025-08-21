import { ModuleRepository } from '../../domain/repositories/module.repository';
import {
  ListModulesUseCase,
  ListModulesRequest,
  ListModulesResponse,
} from '../../domain/use-cases/list-modules.use-case';
import { LoggerService } from '../../../../shared/infrastructure/logging/logger.service';

export class ListModulesUseCaseImpl extends ListModulesUseCase {
  private readonly logger = LoggerService.getInstance();

  constructor(private readonly moduleRepository: ModuleRepository) {
    super();
  }

  async execute(request: ListModulesRequest): Promise<ListModulesResponse> {
    try {
      this.logger.info('Listing modules', {
        page: request.page,
        limit: request.limit,
        search: request.search,
        isActive: request.isActive,
      });

      const result = await this.moduleRepository.findMany({
        filter: {
          ...(request.search && { name: request.search }),
          ...(request.isActive !== undefined && { isActive: request.isActive }),
        },
        pagination: {
          page: request.page,
          limit: request.limit,
        },
        orderBy: {
          field: request.sortBy,
          direction: request.sortOrder,
        },
      });

      const totalPages = Math.ceil(result.total / request.limit);
      const hasNextPage = request.page < totalPages;
      const hasPreviousPage = request.page > 1;

      this.logger.info('Modules listed successfully', {
        total: result.total,
        page: request.page,
        totalPages,
      });

      return {
        modules: result.data,
        total: result.total,
        page: request.page,
        limit: request.limit,
        totalPages,
        hasNextPage,
        hasPreviousPage,
      };
    } catch (error) {
      this.logger.error('Failed to list modules', error);
      throw error;
    }
  }
}
