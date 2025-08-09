import { PrismaClient } from '@prisma/client';
import {
  RoleRepository,
  CreateRoleData,
  UpdateRoleData,
} from '../../domain/repositories/role.repository';
import { RoleEntity } from '../../domain/entities/role.entity';
import {
  NotFoundException,
  ConflictException,
} from '../../../../shared/domain/exceptions/global-exceptions';

export class RoleRepositoryImpl extends RoleRepository {
  constructor(private readonly prisma: PrismaClient) {
    super();
  }

  async findAll(options?: { skip?: number; take?: number }): Promise<RoleEntity[]> {
    const roles = await this.prisma.role.findMany({
      skip: options?.skip,
      take: options?.take,
      orderBy: { createdAt: 'desc' },
    });

    return roles.map(role =>
      RoleEntity.fromPersistence({
        id: role.id,
        name: role.name,
        description: role.description || undefined,
        isSystem: role.isSystem,
        createdAt: role.createdAt,
        updatedAt: role.updatedAt,
      })
    );
  }

  async findById(id: string): Promise<RoleEntity | null> {
    const role = await this.prisma.role.findUnique({
      where: { id },
    });

    if (!role) {
      return null;
    }

    return RoleEntity.fromPersistence({
      id: role.id,
      name: role.name,
      description: role.description || undefined,
      isSystem: role.isSystem,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    });
  }

  async create(data: CreateRoleData): Promise<RoleEntity> {
    const existingRole = await this.existsByName(data.name);
    if (existingRole) {
      throw new ConflictException(`Role with name '${data.name}' already exists`);
    }

    const role = await this.prisma.role.create({
      data: {
        name: data.name,
        description: data.description,
        isSystem: data.isSystem || false,
      },
    });

    return RoleEntity.fromPersistence({
      id: role.id,
      name: role.name,
      description: role.description || undefined,
      isSystem: role.isSystem,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    });
  }

  async update(id: string, data: UpdateRoleData): Promise<RoleEntity> {
    const existingRole = await this.findById(id);
    if (!existingRole) {
      throw new NotFoundException(`Role with id '${id}' not found`);
    }

    if (data.name && data.name !== existingRole.name) {
      const nameExists = await this.existsByName(data.name);
      if (nameExists) {
        throw new ConflictException(`Role with name '${data.name}' already exists`);
      }
    }

    const updatedRole = await this.prisma.role.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
      },
    });

    return RoleEntity.fromPersistence({
      id: updatedRole.id,
      name: updatedRole.name,
      description: updatedRole.description || undefined,
      isSystem: updatedRole.isSystem,
      createdAt: updatedRole.createdAt,
      updatedAt: updatedRole.updatedAt,
    });
  }

  async delete(id: string): Promise<void> {
    const role = await this.findById(id);
    if (!role) {
      throw new NotFoundException(`Role with id '${id}' not found`);
    }

    if (!role.canBeDeleted()) {
      throw new ConflictException('System roles cannot be deleted');
    }

    await this.prisma.role.delete({
      where: { id },
    });
  }

  async exists(id: string): Promise<boolean> {
    const role = await this.prisma.role.findUnique({
      where: { id },
      select: { id: true },
    });

    return !!role;
  }

  async count(): Promise<number> {
    return await this.prisma.role.count();
  }

  async findByName(name: string): Promise<RoleEntity | null> {
    const role = await this.prisma.role.findUnique({
      where: { name },
    });

    if (!role) {
      return null;
    }

    return RoleEntity.fromPersistence({
      id: role.id,
      name: role.name,
      description: role.description || undefined,
      isSystem: role.isSystem,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    });
  }

  async findSystemRoles(): Promise<RoleEntity[]> {
    const roles = await this.prisma.role.findMany({
      where: { isSystem: true },
      orderBy: { createdAt: 'desc' },
    });

    return roles.map(role =>
      RoleEntity.fromPersistence({
        id: role.id,
        name: role.name,
        description: role.description || undefined,
        isSystem: role.isSystem,
        createdAt: role.createdAt,
        updatedAt: role.updatedAt,
      })
    );
  }

  async findNonSystemRoles(): Promise<RoleEntity[]> {
    const roles = await this.prisma.role.findMany({
      where: { isSystem: false },
      orderBy: { createdAt: 'desc' },
    });

    return roles.map(role =>
      RoleEntity.fromPersistence({
        id: role.id,
        name: role.name,
        description: role.description || undefined,
        isSystem: role.isSystem,
        createdAt: role.createdAt,
        updatedAt: role.updatedAt,
      })
    );
  }

  async existsByName(name: string): Promise<boolean> {
    const role = await this.prisma.role.findUnique({
      where: { name },
      select: { id: true },
    });

    return !!role;
  }

  async findRolesWithPermissions(roleIds: string[]): Promise<RoleEntity[]> {
    const roles = await this.prisma.role.findMany({
      where: {
        id: { in: roleIds },
      },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    return roles.map(role =>
      RoleEntity.fromPersistence({
        id: role.id,
        name: role.name,
        description: role.description || undefined,
        isSystem: role.isSystem,
        createdAt: role.createdAt,
        updatedAt: role.updatedAt,
      })
    );
  }

  async assignPermissionToRole(roleId: string, permissionId: string): Promise<void> {
    await this.prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId,
          permissionId,
        },
      },
      update: {},
      create: {
        roleId,
        permissionId,
      },
    });
  }

  async removePermissionFromRole(roleId: string, permissionId: string): Promise<void> {
    await this.prisma.rolePermission.deleteMany({
      where: {
        roleId,
        permissionId,
      },
    });
  }

  async getRolePermissions(roleId: string): Promise<string[]> {
    const rolePermissions = await this.prisma.rolePermission.findMany({
      where: { roleId },
      select: { permissionId: true },
    });

    return rolePermissions.map(rp => rp.permissionId);
  }

  async findRolesByUserId(userId: string): Promise<RoleEntity[]> {
    const userRoles = await this.prisma.userRole.findMany({
      where: { userId },
      include: {
        role: true,
      },
    });

    return userRoles.map(ur =>
      RoleEntity.fromPersistence({
        id: ur.role.id,
        name: ur.role.name,
        description: ur.role.description || undefined,
        isSystem: ur.role.isSystem,
        createdAt: ur.role.createdAt,
        updatedAt: ur.role.updatedAt,
      })
    );
  }

  async assignRoleToUser(userId: string, roleId: string): Promise<void> {
    await this.prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId,
          roleId,
        },
      },
      update: {},
      create: {
        userId,
        roleId,
      },
    });
  }

  async removeRoleFromUser(userId: string, roleId: string): Promise<void> {
    await this.prisma.userRole.deleteMany({
      where: {
        userId,
        roleId,
      },
    });
  }

  async getUserRoles(userId: string): Promise<string[]> {
    const userRoles = await this.prisma.userRole.findMany({
      where: { userId },
      select: { roleId: true },
    });

    return userRoles.map(ur => ur.roleId);
  }

  async bulkAssignRolesToUser(userId: string, roleIds: string[]): Promise<void> {
    const data = roleIds.map(roleId => ({
      userId,
      roleId,
    }));

    await this.prisma.userRole.createMany({
      data,
      skipDuplicates: true,
    });
  }

  async bulkRemoveRolesFromUser(userId: string, roleIds: string[]): Promise<void> {
    await this.prisma.userRole.deleteMany({
      where: {
        userId,
        roleId: { in: roleIds },
      },
    });
  }
}
