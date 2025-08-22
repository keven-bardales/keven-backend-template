import { DependencyContainer } from './dependency.container';
import { TOKENS } from './tokens';
import { EnvironmentConfigService } from '../../infrastructure/config/environment.config';
import { DatabaseConfig } from '../../infrastructure/config/database.config';
import { PrismaClientService } from '../../infrastructure/database/prisma.client';
import { BcryptPasswordService } from '../../../modules/users/infrastructure/services/bcrypt-password.service';
import { UserRepositoryImpl } from '../../../modules/users/infrastructure/repositories/user.repository.impl';
import { CreateUserUseCaseImpl } from '../../../modules/users/application/use-cases/create-user.use-case.impl';
import { GetUsersUseCaseImpl } from '../../../modules/users/application/use-cases/get-users.use-case.impl';
import { GetUserByIdUseCaseImpl } from '../../../modules/users/application/use-cases/get-user-by-id.use-case.impl';
import { UpdateUserUseCaseImpl } from '../../../modules/users/application/use-cases/update-user.use-case.impl';
import { DeleteUserUseCaseImpl } from '../../../modules/users/application/use-cases/delete-user.use-case.impl';
import { UsersController } from '../../../modules/users/infrastructure/controllers/users.controller';
import { JwtServiceImpl } from '../../../modules/auth/infrastructure/services/jwt.service.impl';
import { TokenServiceImpl } from '../../../modules/auth/infrastructure/services/token.service.impl';
import { AuthRepositoryImpl } from '../../../modules/auth/infrastructure/repositories/auth.repository.impl';
import { LoginUseCaseImpl } from '../../../modules/auth/application/use-cases/login.use-case.impl';
import { RefreshTokenUseCaseImpl } from '../../../modules/auth/application/use-cases/refresh-token.use-case.impl';
import { LogoutUseCaseImpl } from '../../../modules/auth/application/use-cases/logout.use-case.impl';
import { RegisterUseCaseImpl } from '../../../modules/auth/application/use-cases/register.use-case.impl';
import { AuthController } from '../../../modules/auth/infrastructure/controllers/auth.controller';
import { RoleRepositoryImpl } from '../../../modules/rbac/infrastructure/repositories/role.repository.impl';
import { PermissionRepositoryImpl } from '../../../modules/rbac/infrastructure/repositories/permission.repository.impl';
import { ModuleRepositoryImpl } from '../../../modules/rbac/infrastructure/repositories/module.repository.impl';
import { CreateRoleUseCaseImpl } from '../../../modules/rbac/application/use-cases/create-role.use-case.impl';
import { ListRolesUseCaseImpl } from '../../../modules/rbac/application/use-cases/list-roles.use-case.impl';
import { RolesController } from '../../../modules/rbac/infrastructure/controllers/roles.controller';
import { ListModulesUseCaseImpl } from '../../../modules/rbac/application/use-cases/list-modules.use-case.impl';
import { CreateModuleUseCaseImpl } from '../../../modules/rbac/application/use-cases/create-module.use-case.impl';
import { UpdateModuleUseCaseImpl } from '../../../modules/rbac/application/use-cases/update-module.use-case.impl';
import { DeleteModuleUseCaseImpl } from '../../../modules/rbac/application/use-cases/delete-module.use-case.impl';
import { ModulesController } from '../../../modules/rbac/infrastructure/controllers/modules.controller';

export class DependencyRegistrar {
  private constructor() {}

  public static register(container: DependencyContainer): void {
    console.log('Starting dependency registration...');

    try {
      // Register configuration and infrastructure first
      this.registerInfrastructure(container);

      // Register shared services
      this.registerSharedServices(container);

      // Register module dependencies
      this.registerUserModule(container);
      this.registerAuthModule(container);
      this.registerRbacModule(container);

      // Validate all dependencies
      container.validateDependencies();

      console.log('✅ All dependencies registered successfully');
    } catch (error) {
      console.error('❌ Failed to register dependencies:', error);
      throw error;
    }
  }

  private static registerInfrastructure(container: DependencyContainer): void {
    console.log('📦 Registering infrastructure dependencies...');

    // Environment configuration
    const envConfig = EnvironmentConfigService.getInstance().get();
    container.registerValue(TOKENS.ENVIRONMENT_CONFIG, envConfig);

    // Database configuration
    const databaseConfig = new DatabaseConfig(envConfig);
    container.registerValue(TOKENS.DATABASE_CONFIG, databaseConfig);

    // Prisma client - register the actual PrismaClient instance
    console.log({
      config: databaseConfig,
    });
    const prismaService = PrismaClientService.getInstance(databaseConfig);
    container.registerValue(TOKENS.PRISMA_CLIENT, prismaService.getClient());
  }

  private static registerSharedServices(container: DependencyContainer): void {
    console.log('🔧 Registering shared services...');

    // Password service
    container.registerClass(TOKENS.PASSWORD_SERVICE, BcryptPasswordService, {
      isSingleton: true,
    });
  }

  private static registerUserModule(container: DependencyContainer): void {
    console.log('👤 Registering user module dependencies...');

    // Repository
    container.registerClass(TOKENS.USER_REPOSITORY, UserRepositoryImpl, {
      dependencies: [TOKENS.PRISMA_CLIENT],
    });

    // Use cases
    container.registerClass(TOKENS.CREATE_USER_USE_CASE, CreateUserUseCaseImpl, {
      dependencies: [TOKENS.USER_REPOSITORY, TOKENS.PASSWORD_SERVICE],
    });

    container.registerClass(TOKENS.GET_USERS_USE_CASE, GetUsersUseCaseImpl, {
      dependencies: [TOKENS.USER_REPOSITORY],
    });

    container.registerClass(TOKENS.GET_USER_BY_ID_USE_CASE, GetUserByIdUseCaseImpl, {
      dependencies: [TOKENS.USER_REPOSITORY],
    });

    container.registerClass(TOKENS.UPDATE_USER_USE_CASE, UpdateUserUseCaseImpl, {
      dependencies: [TOKENS.USER_REPOSITORY],
    });

    container.registerClass(TOKENS.DELETE_USER_USE_CASE, DeleteUserUseCaseImpl, {
      dependencies: [TOKENS.USER_REPOSITORY],
    });

    // Controller
    container.registerClass(TOKENS.USERS_CONTROLLER, UsersController, {
      dependencies: [
        TOKENS.CREATE_USER_USE_CASE,
        TOKENS.GET_USERS_USE_CASE,
        TOKENS.GET_USER_BY_ID_USE_CASE,
        TOKENS.UPDATE_USER_USE_CASE,
        TOKENS.DELETE_USER_USE_CASE,
      ],
    });
  }

  private static registerAuthModule(container: DependencyContainer): void {
    console.log('🔐 Registering auth module dependencies...');

    // Services
    container.registerClass(TOKENS.JWT_SERVICE, JwtServiceImpl, {
      isSingleton: true,
    });

    container.registerClass(TOKENS.TOKEN_SERVICE, TokenServiceImpl, {
      dependencies: [
        TOKENS.JWT_SERVICE,
        TOKENS.AUTH_REPOSITORY,
        TOKENS.USER_REPOSITORY,
        TOKENS.ROLE_REPOSITORY,
        TOKENS.PERMISSION_REPOSITORY,
        TOKENS.MODULE_REPOSITORY,
      ],
    });

    // Repository
    container.registerClass(TOKENS.AUTH_REPOSITORY, AuthRepositoryImpl, {
      dependencies: [TOKENS.PRISMA_CLIENT],
    });

    // Use cases
    container.registerClass(TOKENS.LOGIN_USE_CASE, LoginUseCaseImpl, {
      dependencies: [
        TOKENS.USER_REPOSITORY,
        TOKENS.PASSWORD_SERVICE,
        TOKENS.TOKEN_SERVICE,
        TOKENS.AUTH_REPOSITORY,
      ],
    });

    container.registerClass(TOKENS.REFRESH_TOKEN_USE_CASE, RefreshTokenUseCaseImpl, {
      dependencies: [TOKENS.TOKEN_SERVICE, TOKENS.AUTH_REPOSITORY, TOKENS.USER_REPOSITORY],
    });

    container.registerClass(TOKENS.LOGOUT_USE_CASE, LogoutUseCaseImpl, {
      dependencies: [TOKENS.TOKEN_SERVICE, TOKENS.AUTH_REPOSITORY, TOKENS.JWT_SERVICE],
    });

    container.registerClass(TOKENS.REGISTER_USE_CASE, RegisterUseCaseImpl, {
      dependencies: [TOKENS.USER_REPOSITORY, TOKENS.PASSWORD_SERVICE],
    });

    // Controller
    container.registerClass(TOKENS.AUTH_CONTROLLER, AuthController, {
      dependencies: [
        TOKENS.LOGIN_USE_CASE,
        TOKENS.REFRESH_TOKEN_USE_CASE,
        TOKENS.LOGOUT_USE_CASE,
        TOKENS.REGISTER_USE_CASE,
      ],
    });
  }

  private static registerRbacModule(container: DependencyContainer): void {
    console.log('👑 Registering RBAC module dependencies...');

    // Repositories
    container.registerClass(TOKENS.ROLE_REPOSITORY, RoleRepositoryImpl, {
      dependencies: [TOKENS.PRISMA_CLIENT],
    });

    container.registerClass(TOKENS.PERMISSION_REPOSITORY, PermissionRepositoryImpl, {
      dependencies: [TOKENS.PRISMA_CLIENT],
    });

    container.registerClass(TOKENS.MODULE_REPOSITORY, ModuleRepositoryImpl, {
      dependencies: [TOKENS.PRISMA_CLIENT],
    });

    // Use cases
    container.registerClass(TOKENS.CREATE_ROLE_USE_CASE, CreateRoleUseCaseImpl, {
      dependencies: [TOKENS.ROLE_REPOSITORY],
    });

    container.registerClass(TOKENS.LIST_ROLES_USE_CASE, ListRolesUseCaseImpl, {
      dependencies: [TOKENS.ROLE_REPOSITORY],
    });

    // Module use cases
    container.registerClass(TOKENS.LIST_MODULES_USE_CASE, ListModulesUseCaseImpl, {
      dependencies: [TOKENS.MODULE_REPOSITORY],
    });

    container.registerClass(TOKENS.CREATE_MODULE_USE_CASE, CreateModuleUseCaseImpl, {
      dependencies: [TOKENS.MODULE_REPOSITORY],
    });

    container.registerClass(TOKENS.UPDATE_MODULE_USE_CASE, UpdateModuleUseCaseImpl, {
      dependencies: [TOKENS.MODULE_REPOSITORY],
    });

    container.registerClass(TOKENS.DELETE_MODULE_USE_CASE, DeleteModuleUseCaseImpl, {
      dependencies: [TOKENS.MODULE_REPOSITORY],
    });

    // Controllers
    container.registerClass(TOKENS.ROLES_CONTROLLER, RolesController, {
      dependencies: [
        TOKENS.CREATE_ROLE_USE_CASE,
        TOKENS.LIST_ROLES_USE_CASE,
        TOKENS.ROLE_REPOSITORY,
      ],
    });

    container.registerClass(TOKENS.MODULES_CONTROLLER, ModulesController, {
      dependencies: [
        TOKENS.LIST_MODULES_USE_CASE,
        TOKENS.CREATE_MODULE_USE_CASE,
        TOKENS.UPDATE_MODULE_USE_CASE,
        TOKENS.DELETE_MODULE_USE_CASE,
        TOKENS.MODULE_REPOSITORY,
      ],
    });
  }
}

// Global container instance
export const globalContainer = new DependencyContainer();
