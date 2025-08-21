import { ModuleRepository } from '../../domain/repositories/module.repository';
import {
  UpdateModuleUseCase,
  UpdateModuleRequest,
  UpdateModuleResponse,
} from '../../domain/use-cases/update-module.use-case';
import { LoggerService } from '../../../../shared/infrastructure/logging/logger.service';
import {
  NotFoundException,
  ConflictException,
} from '../../../../shared/domain/exceptions/global-exceptions';

export class UpdateModuleUseCaseImpl extends UpdateModuleUseCase {
  private readonly logger = LoggerService.getInstance();

  constructor(private readonly moduleRepository: ModuleRepository) {
    super();
  }

  async execute(request: UpdateModuleRequest): Promise<UpdateModuleResponse> {
    try {
      this.logger.info('Updating module', { id: request.id });

      // Find existing module
      const existingModule = await this.moduleRepository.findById(request.id);
      if (!existingModule) {
        throw new NotFoundException(`Module with id '${request.id}' not found`);
      }

      // Check for name conflicts if name is being updated
      if (request.name && request.name !== existingModule.name) {
        const moduleWithSameName = await this.moduleRepository.findByName(request.name);
        if (moduleWithSameName && moduleWithSameName.id !== request.id) {
          throw new ConflictException(`Module with name '${request.name}' already exists`);
        }
      }

      // Update module
      const updatedModule = await this.moduleRepository.update(request.id, {
        name: request.name,
        description: request.description === null ? undefined : request.description,
        isActive: request.isActive,
      });

      this.logger.info('Module updated successfully', {
        id: updatedModule.id,
        name: updatedModule.name,
      });

      return {
        module: updatedModule,
      };
    } catch (error) {
      this.logger.error('Failed to update module', error, { id: request.id });
      throw error;
    }
  }
}
