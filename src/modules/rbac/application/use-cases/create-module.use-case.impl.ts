import { ModuleRepository } from '../../domain/repositories/module.repository';
import {
  CreateModuleUseCase,
  CreateModuleRequest,
  CreateModuleResponse,
} from '../../domain/use-cases/create-module.use-case';
import { ModuleEntity } from '../../domain/entities/module.entity';
import { LoggerService } from '../../../../shared/infrastructure/logging/logger.service';
import { ConflictException } from '../../../../shared/domain/exceptions/global-exceptions';

export class CreateModuleUseCaseImpl extends CreateModuleUseCase {
  private readonly logger = LoggerService.getInstance();

  constructor(private readonly moduleRepository: ModuleRepository) {
    super();
  }

  async execute(request: CreateModuleRequest): Promise<CreateModuleResponse> {
    try {
      this.logger.info('Creating module', { name: request.name });

      // Check if module with same name already exists
      const existingModule = await this.moduleRepository.findByName(request.name);
      if (existingModule) {
        throw new ConflictException(`Module with name '${request.name}' already exists`);
      }

      // Create new module entity
      const module = ModuleEntity.create({
        name: request.name,
        description: request.description,
        isActive: request.isActive ?? true,
      });

      // Save to repository
      const savedModule = await this.moduleRepository.create({
        name: module.name,
        description: module.description,
        isActive: module.isActive,
      });

      this.logger.info('Module created successfully', {
        id: savedModule.id,
        name: savedModule.name,
      });

      return {
        module: savedModule,
      };
    } catch (error) {
      this.logger.error('Failed to create module', error, { name: request.name });
      throw error;
    }
  }
}
