import { PrismaClient } from '@prisma/client';
import {
  PermissionRepository,
  CreatePermissionData,
  UpdatePermissionData,
} from '../../domain/repositories/permission.repository';
import { PermissionEntity } from '../../domain/entities/permission.entity';
import {
  NotFoundException,
  ConflictException,
} from '../../../../shared/domain/exceptions/global-exceptions';

export class PermissionRepositoryImpl extends PermissionRepository {
  constructor(private readonly prisma: PrismaClient) {
    super();
  }

  async findAll(options?: { skip?: number; take?: number }): Promise<PermissionEntity[]> {
    const permissions = await this.prisma.permission.findMany({
      skip: options?.skip,
      take: options?.take,
      orderBy: { createdAt: 'desc' },
      include: {
        module: true,
      },
    });

    return permissions.map(permission =>
      PermissionEntity.fromPersistence({
        id: permission.id,
        moduleId: permission.moduleId,
        action: permission.action,
        scope: permission.scope || undefined,
        name: permission.name,
        description: permission.description || undefined,
        createdAt: permission.createdAt,
        updatedAt: permission.updatedAt,
      })
    );
  }

  async findById(id: string): Promise<PermissionEntity | null> {
    const permission = await this.prisma.permission.findUnique({
      where: { id },
      include: {
        module: true,
      },
    });

    if (!permission) {
      return null;
    }

    return PermissionEntity.fromPersistence({
      id: permission.id,
      moduleId: permission.moduleId,
      action: permission.action,
      scope: permission.scope || undefined,
      name: permission.name,
      description: permission.description || undefined,
      createdAt: permission.createdAt,
      updatedAt: permission.updatedAt,
    });
  }

  async create(data: CreatePermissionData): Promise<PermissionEntity> {
    const exists = await this.existsByModuleAndAction(data.moduleId, data.action, data.scope);
    if (exists) {
      throw new ConflictException(
        `Permission with action '${data.action}' and scope '${data.scope || 'global'}' already exists in this module`
      );
    }

    const permission = await this.prisma.permission.create({
      data: {
        moduleId: data.moduleId,
        action: data.action,
        scope: data.scope,
        name: data.name,
        description: data.description,
      },
      include: {
        module: true,
      },
    });

    return PermissionEntity.fromPersistence({
      id: permission.id,
      moduleId: permission.moduleId,
      action: permission.action,
      scope: permission.scope || undefined,
      name: permission.name,
      description: permission.description || undefined,
      createdAt: permission.createdAt,
      updatedAt: permission.updatedAt,
    });
  }

  async update(id: string, data: UpdatePermissionData): Promise<PermissionEntity> {
    const existingPermission = await this.findById(id);
    if (!existingPermission) {
      throw new NotFoundException(`Permission with id '${id}' not found`);
    }

    const updatedPermission = await this.prisma.permission.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
      },
      include: {
        module: true,
      },
    });

    return PermissionEntity.fromPersistence({
      id: updatedPermission.id,
      moduleId: updatedPermission.moduleId,
      action: updatedPermission.action,
      scope: updatedPermission.scope || undefined,
      name: updatedPermission.name,
      description: updatedPermission.description || undefined,
      createdAt: updatedPermission.createdAt,
      updatedAt: updatedPermission.updatedAt,
    });
  }

  async delete(id: string): Promise<void> {
    const permission = await this.findById(id);
    if (!permission) {
      throw new NotFoundException(`Permission with id '${id}' not found`);
    }

    await this.prisma.permission.delete({
      where: { id },
    });
  }

  async exists(id: string): Promise<boolean> {
    const permission = await this.prisma.permission.findUnique({
      where: { id },
      select: { id: true },
    });

    return !!permission;
  }

  async count(): Promise<number> {
    return await this.prisma.permission.count();
  }

  async findByModuleAndAction(
    moduleId: string,
    action: string,
    scope?: string
  ): Promise<PermissionEntity | null> {
    const permission = await this.prisma.permission.findFirst({
      where: {
        moduleId,
        action,
        scope: scope || null,
      },
      include: {
        module: true,
      },
    });

    if (!permission) {
      return null;
    }

    return PermissionEntity.fromPersistence({
      id: permission.id,
      moduleId: permission.moduleId,
      action: permission.action,
      scope: permission.scope || undefined,
      name: permission.name,
      description: permission.description || undefined,
      createdAt: permission.createdAt,
      updatedAt: permission.updatedAt,
    });
  }

  async findByModule(moduleId: string): Promise<PermissionEntity[]> {
    const permissions = await this.prisma.permission.findMany({
      where: { moduleId },
      orderBy: { name: 'asc' },
      include: {
        module: true,
      },
    });

    return permissions.map(permission =>
      PermissionEntity.fromPersistence({
        id: permission.id,
        moduleId: permission.moduleId,
        action: permission.action,
        scope: permission.scope || undefined,
        name: permission.name,
        description: permission.description || undefined,
        createdAt: permission.createdAt,
        updatedAt: permission.updatedAt,
      })
    );
  }

  async findByAction(action: string): Promise<PermissionEntity[]> {
    const permissions = await this.prisma.permission.findMany({
      where: { action },
      orderBy: { name: 'asc' },
      include: {
        module: true,
      },
    });

    return permissions.map(permission =>
      PermissionEntity.fromPersistence({
        id: permission.id,
        moduleId: permission.moduleId,
        action: permission.action,
        scope: permission.scope || undefined,
        name: permission.name,
        description: permission.description || undefined,
        createdAt: permission.createdAt,
        updatedAt: permission.updatedAt,
      })
    );
  }

  async existsByModuleAndAction(
    moduleId: string,
    action: string,
    scope?: string
  ): Promise<boolean> {
    const permission = await this.prisma.permission.findFirst({
      where: {
        moduleId,
        action,
        scope: scope || null,
      },
      select: { id: true },
    });

    return !!permission;
  }

  async findPermissionsByRoleId(roleId: string): Promise<PermissionEntity[]> {
    const rolePermissions = await this.prisma.rolePermission.findMany({
      where: { roleId },
      include: {
        permission: {
          include: {
            module: true,
          },
        },
      },
    });

    return rolePermissions.map(rp =>
      PermissionEntity.fromPersistence({
        id: rp.permission.id,
        moduleId: rp.permission.moduleId,
        action: rp.permission.action,
        scope: rp.permission.scope || undefined,
        name: rp.permission.name,
        description: rp.permission.description || undefined,
        createdAt: rp.permission.createdAt,
        updatedAt: rp.permission.updatedAt,
      })
    );
  }

  async findPermissionsByUserId(userId: string): Promise<PermissionEntity[]> {
    const userPermissions = await this.prisma.rolePermission.findMany({
      where: {
        role: {
          userRoles: {
            some: { userId },
          },
        },
      },
      include: {
        permission: {
          include: {
            module: true,
          },
        },
      },
    });

    const permissions = new Map<string, PermissionEntity>();

    userPermissions.forEach(up => {
      const permission = PermissionEntity.fromPersistence({
        id: up.permission.id,
        moduleId: up.permission.moduleId,
        action: up.permission.action,
        scope: up.permission.scope || undefined,
        name: up.permission.name,
        description: up.permission.description || undefined,
        createdAt: up.permission.createdAt,
        updatedAt: up.permission.updatedAt,
      });
      permissions.set(permission.id, permission);
    });

    return Array.from(permissions.values());
  }

  async findPermissionsByRoleIds(roleIds: string[]): Promise<PermissionEntity[]> {
    const rolePermissions = await this.prisma.rolePermission.findMany({
      where: {
        roleId: { in: roleIds },
      },
      include: {
        permission: {
          include: {
            module: true,
          },
        },
      },
    });

    const permissions = new Map<string, PermissionEntity>();

    rolePermissions.forEach(rp => {
      const permission = PermissionEntity.fromPersistence({
        id: rp.permission.id,
        moduleId: rp.permission.moduleId,
        action: rp.permission.action,
        scope: rp.permission.scope || undefined,
        name: rp.permission.name,
        description: rp.permission.description || undefined,
        createdAt: rp.permission.createdAt,
        updatedAt: rp.permission.updatedAt,
      });
      permissions.set(permission.id, permission);
    });

    return Array.from(permissions.values());
  }

  async searchPermissions(
    searchTerm: string,
    options?: {
      skip?: number;
      take?: number;
      moduleId?: string;
    }
  ): Promise<PermissionEntity[]> {
    const where: any = {
      OR: [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { action: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
      ],
    };

    if (options?.moduleId) {
      where.moduleId = options.moduleId;
    }

    const permissions = await this.prisma.permission.findMany({
      where,
      skip: options?.skip,
      take: options?.take,
      orderBy: { name: 'asc' },
      include: {
        module: true,
      },
    });

    return permissions.map(permission =>
      PermissionEntity.fromPersistence({
        id: permission.id,
        moduleId: permission.moduleId,
        action: permission.action,
        scope: permission.scope || undefined,
        name: permission.name,
        description: permission.description || undefined,
        createdAt: permission.createdAt,
        updatedAt: permission.updatedAt,
      })
    );
  }

  async countPermissionsByModule(moduleId: string): Promise<number> {
    return await this.prisma.permission.count({
      where: { moduleId },
    });
  }

  async bulkCreate(permissions: CreatePermissionData[]): Promise<PermissionEntity[]> {
    const data = permissions.map(p => ({
      moduleId: p.moduleId,
      action: p.action,
      scope: p.scope,
      name: p.name,
      description: p.description,
    }));

    await this.prisma.permission.createMany({
      data,
      skipDuplicates: true,
    });

    return await this.findAll({ take: permissions.length });
  }

  async bulkDelete(permissionIds: string[]): Promise<void> {
    await this.prisma.permission.deleteMany({
      where: {
        id: { in: permissionIds },
      },
    });
  }
}
