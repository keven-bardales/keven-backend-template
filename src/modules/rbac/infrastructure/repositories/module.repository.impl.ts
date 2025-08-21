import { PrismaClient } from '@prisma/client';
import {
  ModuleRepository,
  CreateModuleData,
  UpdateModuleData,
} from '../../domain/repositories/module.repository';
import { ModuleEntity } from '../../domain/entities/module.entity';
import {
  NotFoundException,
  ConflictException,
} from '../../../../shared/domain/exceptions/global-exceptions';

export class ModuleRepositoryImpl extends ModuleRepository {
  constructor(private readonly prisma: PrismaClient) {
    super();
  }

  async findAll(options?: { skip?: number; take?: number }): Promise<ModuleEntity[]> {
    const modules = await this.prisma.module.findMany({
      skip: options?.skip,
      take: options?.take,
      orderBy: { createdAt: 'desc' },
    });

    return modules.map(module =>
      ModuleEntity.fromPersistence({
        id: module.id,
        name: module.name,
        description: module.description || undefined,
        isActive: module.isActive,
        createdAt: module.createdAt,
        updatedAt: module.updatedAt,
      })
    );
  }

  async findById(id: string): Promise<ModuleEntity | null> {
    const module = await this.prisma.module.findUnique({
      where: { id },
    });

    if (!module) {
      return null;
    }

    return ModuleEntity.fromPersistence({
      id: module.id,
      name: module.name,
      description: module.description || undefined,
      isActive: module.isActive,
      createdAt: module.createdAt,
      updatedAt: module.updatedAt,
    });
  }

  async create(data: CreateModuleData): Promise<ModuleEntity> {
    const existingModule = await this.existsByName(data.name);
    if (existingModule) {
      throw new ConflictException(`Module with name '${data.name}' already exists`);
    }

    const module = await this.prisma.module.create({
      data: {
        name: data.name,
        description: data.description,
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
    });

    return ModuleEntity.fromPersistence({
      id: module.id,
      name: module.name,
      description: module.description || undefined,
      isActive: module.isActive,
      createdAt: module.createdAt,
      updatedAt: module.updatedAt,
    });
  }

  async update(id: string, data: UpdateModuleData): Promise<ModuleEntity> {
    const existingModule = await this.findById(id);
    if (!existingModule) {
      throw new NotFoundException(`Module with id '${id}' not found`);
    }

    if (data.name && data.name !== existingModule.name) {
      const nameExists = await this.existsByName(data.name);
      if (nameExists) {
        throw new ConflictException(`Module with name '${data.name}' already exists`);
      }
    }

    const updatedModule = await this.prisma.module.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        isActive: data.isActive,
      },
    });

    return ModuleEntity.fromPersistence({
      id: updatedModule.id,
      name: updatedModule.name,
      description: updatedModule.description || undefined,
      isActive: updatedModule.isActive,
      createdAt: updatedModule.createdAt,
      updatedAt: updatedModule.updatedAt,
    });
  }

  async delete(id: string): Promise<void> {
    const module = await this.findById(id);
    if (!module) {
      throw new NotFoundException(`Module with id '${id}' not found`);
    }

    await this.prisma.module.delete({
      where: { id },
    });
  }

  async exists(id: string): Promise<boolean> {
    const module = await this.prisma.module.findUnique({
      where: { id },
      select: { id: true },
    });

    return !!module;
  }

  async count(): Promise<number> {
    return await this.prisma.module.count();
  }

  async findByName(name: string): Promise<ModuleEntity | null> {
    const module = await this.prisma.module.findUnique({
      where: { name },
    });

    if (!module) {
      return null;
    }

    return ModuleEntity.fromPersistence({
      id: module.id,
      name: module.name,
      description: module.description || undefined,
      isActive: module.isActive,
      createdAt: module.createdAt,
      updatedAt: module.updatedAt,
    });
  }

  async findActiveModules(): Promise<ModuleEntity[]> {
    const modules = await this.prisma.module.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    return modules.map(module =>
      ModuleEntity.fromPersistence({
        id: module.id,
        name: module.name,
        description: module.description || undefined,
        isActive: module.isActive,
        createdAt: module.createdAt,
        updatedAt: module.updatedAt,
      })
    );
  }

  async findInactiveModules(): Promise<ModuleEntity[]> {
    const modules = await this.prisma.module.findMany({
      where: { isActive: false },
      orderBy: { createdAt: 'desc' },
    });

    return modules.map(module =>
      ModuleEntity.fromPersistence({
        id: module.id,
        name: module.name,
        description: module.description || undefined,
        isActive: module.isActive,
        createdAt: module.createdAt,
        updatedAt: module.updatedAt,
      })
    );
  }

  async existsByName(name: string): Promise<boolean> {
    const module = await this.prisma.module.findUnique({
      where: { name },
      select: { id: true },
    });

    return !!module;
  }

  async findModulesWithPermissions(): Promise<ModuleEntity[]> {
    const modules = await this.prisma.module.findMany({
      include: {
        permissions: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return modules.map(module =>
      ModuleEntity.fromPersistence({
        id: module.id,
        name: module.name,
        description: module.description || undefined,
        isActive: module.isActive,
        createdAt: module.createdAt,
        updatedAt: module.updatedAt,
      })
    );
  }

  async countActiveModules(): Promise<number> {
    return await this.prisma.module.count({
      where: { isActive: true },
    });
  }

  async countInactiveModules(): Promise<number> {
    return await this.prisma.module.count({
      where: { isActive: false },
    });
  }

  async searchModules(
    searchTerm: string,
    options?: {
      skip?: number;
      take?: number;
      includeInactive?: boolean;
    }
  ): Promise<ModuleEntity[]> {
    const where: any = {
      OR: [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
      ],
    };

    if (!options?.includeInactive) {
      where.isActive = true;
    }

    const modules = await this.prisma.module.findMany({
      where,
      skip: options?.skip,
      take: options?.take,
      orderBy: { name: 'asc' },
    });

    return modules.map(module =>
      ModuleEntity.fromPersistence({
        id: module.id,
        name: module.name,
        description: module.description || undefined,
        isActive: module.isActive,
        createdAt: module.createdAt,
        updatedAt: module.updatedAt,
      })
    );
  }

  async bulkUpdateStatus(moduleIds: string[], isActive: boolean): Promise<void> {
    await this.prisma.module.updateMany({
      where: {
        id: { in: moduleIds },
      },
      data: {
        isActive,
      },
    });
  }

  async findMany<TFilter extends Record<string, unknown> = Record<string, unknown>>(options?: {
    filter?: TFilter;
    pagination?: {
      page: number;
      limit: number;
    };
    orderBy?: {
      field: keyof ModuleEntity;
      direction: 'asc' | 'desc';
    };
  }): Promise<{
    data: ModuleEntity[];
    total: number;
  }> {
    const where = this.buildWhereClause(options?.filter);
    const orderBy = options?.orderBy
      ? { [options.orderBy.field]: options.orderBy.direction }
      : { createdAt: 'desc' as const };

    const [data, total] = await Promise.all([
      this.prisma.module.findMany({
        where,
        orderBy,
        skip: options?.pagination
          ? (options.pagination.page - 1) * options.pagination.limit
          : undefined,
        take: options?.pagination?.limit,
      }),
      this.prisma.module.count({ where }),
    ]);

    return {
      data: data.map(module =>
        ModuleEntity.fromPersistence({
          id: module.id,
          name: module.name,
          description: module.description || undefined,
          isActive: module.isActive,
          createdAt: module.createdAt,
          updatedAt: module.updatedAt,
        })
      ),
      total,
    };
  }

  private buildWhereClause(filter: Record<string, unknown> | undefined): Record<string, unknown> {
    if (!filter) return {};

    const where: Record<string, unknown> = {};

    // Handle search by name
    if (filter.name && typeof filter.name === 'string') {
      where.OR = [
        { name: { contains: filter.name, mode: 'insensitive' } },
        { description: { contains: filter.name, mode: 'insensitive' } },
      ];
    }

    // Handle isActive filter
    if (typeof filter.isActive === 'boolean') {
      where.isActive = filter.isActive;
    }

    return where;
  }
}
