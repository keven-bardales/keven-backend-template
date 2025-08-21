import { ModuleRepository } from '../../domain/repositories/module.repository';
import {
  DeleteModuleUseCase,
  DeleteModuleRequest,
  DeleteModuleResponse,
} from '../../domain/use-cases/delete-module.use-case';
import { LoggerService } from '../../../../shared/infrastructure/logging/logger.service';
import { NotFoundException } from '../../../../shared/domain/exceptions/global-exceptions';

export class DeleteModuleUseCaseImpl extends DeleteModuleUseCase {
  private readonly logger = LoggerService.getInstance();

  constructor(private readonly moduleRepository: ModuleRepository) {
    super();
  }

  async execute(request: DeleteModuleRequest): Promise<DeleteModuleResponse> {
    try {
      this.logger.info('Deleting module', { id: request.id });

      // Check if module exists
      const existingModule = await this.moduleRepository.findById(request.id);
      if (!existingModule) {
        throw new NotFoundException(`Module with id '${request.id}' not found`);
      }

      // Delete module
      await this.moduleRepository.delete(request.id);

      this.logger.audit('Module deleted', {
        id: request.id,
        name: existingModule.name,
      });

      return {
        success: true,
      };
    } catch (error) {
      this.logger.error('Failed to delete module', error, { id: request.id });
      throw error;
    }
  }
}
