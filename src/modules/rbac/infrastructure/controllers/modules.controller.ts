import { Request, Response } from 'express';
import { ListModulesUseCase } from '../../domain/use-cases/list-modules.use-case';
import { CreateModuleUseCase } from '../../domain/use-cases/create-module.use-case';
import { UpdateModuleUseCase } from '../../domain/use-cases/update-module.use-case';
import { DeleteModuleUseCase } from '../../domain/use-cases/delete-module.use-case';
import { ModuleRepository } from '../../domain/repositories/module.repository';
import { GetModulesDto } from '../../application/dto/get-modules.dto';
import { CreateModuleDto } from '../../application/dto/create-module.dto';
import { UpdateModuleDto } from '../../application/dto/update-module.dto';
import { ApiResponse } from '../../../../shared/domain/wrappers/api-response.wrapper';
import { LoggerService } from '../../../../shared/infrastructure/logging/logger.service';

export class ModulesController {
  private readonly logger = LoggerService.getInstance();

  constructor(
    private readonly listModulesUseCase: ListModulesUseCase,
    private readonly createModuleUseCase: CreateModuleUseCase,
    private readonly updateModuleUseCase: UpdateModuleUseCase,
    private readonly deleteModuleUseCase: DeleteModuleUseCase,
    private readonly moduleRepository: ModuleRepository
  ) {}

  /**
   * Get all modules with pagination and filtering
   */
  public async getModules(req: Request, res: Response): Promise<void> {
    try {
      const query = new GetModulesDto(req.query);

      const result = await this.listModulesUseCase.execute({
        page: query.page,
        limit: query.limit,
        search: query.search,
        isActive: query.isActive,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
      });

      const response = ApiResponse.success(result, 'Modules retrieved successfully');
      res.status(200).json(response.toJSON());
    } catch (error) {
      this.logger.error('Failed to get modules', error);
      const response = ApiResponse.internalError('Failed to retrieve modules');
      res.status(500).json(response.toJSON());
    }
  }

  /**
   * Get a single module by ID
   */
  public async getModuleById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const module = await this.moduleRepository.findById(id);
      if (!module) {
        const response = ApiResponse.notFound('Module not found');
        res.status(404).json(response.toJSON());
        return;
      }

      const response = ApiResponse.success(module.toJSON(), 'Module retrieved successfully');
      res.status(200).json(response.toJSON());
    } catch (error) {
      this.logger.error('Failed to get module by ID', error);
      const response = ApiResponse.internalError('Failed to retrieve module');
      res.status(500).json(response.toJSON());
    }
  }

  /**
   * Create a new module
   */
  public async createModule(req: Request, res: Response): Promise<void> {
    try {
      const createModuleDto = new CreateModuleDto(req.body);

      const result = await this.createModuleUseCase.execute({
        name: createModuleDto.name,
        description: createModuleDto.description,
        isActive: createModuleDto.isActive,
      });

      const response = ApiResponse.success(result.module.toJSON(), 'Module created successfully');
      res.status(201).json(response.toJSON());
    } catch (error) {
      this.logger.error('Failed to create module', error);

      if (error instanceof Error && error.message?.includes('already exists')) {
        const response = ApiResponse.conflict(error.message);
        res.status(409).json(response.toJSON());
        return;
      }

      const response = ApiResponse.internalError('Failed to create module');
      res.status(500).json(response.toJSON());
    }
  }

  /**
   * Update an existing module
   */
  public async updateModule(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateModuleDto = new UpdateModuleDto(req.body);

      const result = await this.updateModuleUseCase.execute({
        id,
        name: updateModuleDto.name,
        description: updateModuleDto.description,
        isActive: updateModuleDto.isActive,
      });

      const response = ApiResponse.success(result.module.toJSON(), 'Module updated successfully');
      res.status(200).json(response.toJSON());
    } catch (error) {
      this.logger.error('Failed to update module', error);

      if (error instanceof Error && error.message?.includes('not found')) {
        const response = ApiResponse.notFound(error.message);
        res.status(404).json(response.toJSON());
        return;
      }

      if (error instanceof Error && error.message?.includes('already exists')) {
        const response = ApiResponse.conflict(error.message);
        res.status(409).json(response.toJSON());
        return;
      }

      const response = ApiResponse.internalError('Failed to update module');
      res.status(500).json(response.toJSON());
    }
  }

  /**
   * Delete a module
   */
  public async deleteModule(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      await this.deleteModuleUseCase.execute({ id });

      const response = ApiResponse.success(null, 'Module deleted successfully');
      res.status(200).json(response.toJSON());
    } catch (error) {
      this.logger.error('Failed to delete module', error);

      if (error instanceof Error && error.message?.includes('not found')) {
        const response = ApiResponse.notFound(error.message);
        res.status(404).json(response.toJSON());
        return;
      }

      const response = ApiResponse.internalError('Failed to delete module');
      res.status(500).json(response.toJSON());
    }
  }

  /**
   * Get active modules only
   */
  public async getActiveModules(req: Request, res: Response): Promise<void> {
    try {
      const modules = await this.moduleRepository.findActiveModules();

      const response = ApiResponse.success(
        modules.map(module => module.toJSON()),
        'Active modules retrieved successfully'
      );
      res.status(200).json(response.toJSON());
    } catch (error) {
      this.logger.error('Failed to get active modules', error);
      const response = ApiResponse.internalError('Failed to retrieve active modules');
      res.status(500).json(response.toJSON());
    }
  }

  /**
   * Activate a module
   */
  public async activateModule(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const module = await this.moduleRepository.findById(id);
      if (!module) {
        const response = ApiResponse.notFound('Module not found');
        res.status(404).json(response.toJSON());
        return;
      }

      const updatedModule = await this.moduleRepository.update(id, { isActive: true });

      const response = ApiResponse.success(updatedModule.toJSON(), 'Module activated successfully');
      res.status(200).json(response.toJSON());
    } catch (error) {
      this.logger.error('Failed to activate module', error);
      const response = ApiResponse.internalError('Failed to activate module');
      res.status(500).json(response.toJSON());
    }
  }

  /**
   * Deactivate a module
   */
  public async deactivateModule(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const module = await this.moduleRepository.findById(id);
      if (!module) {
        const response = ApiResponse.notFound('Module not found');
        res.status(404).json(response.toJSON());
        return;
      }

      const updatedModule = await this.moduleRepository.update(id, { isActive: false });

      const response = ApiResponse.success(
        updatedModule.toJSON(),
        'Module deactivated successfully'
      );
      res.status(200).json(response.toJSON());
    } catch (error) {
      this.logger.error('Failed to deactivate module', error);
      const response = ApiResponse.internalError('Failed to deactivate module');
      res.status(500).json(response.toJSON());
    }
  }
}
