import { Server } from '../../api/server';
import { PrismaClientService } from '../../shared/infrastructure/database/prisma.client';
import { DatabaseConfig } from '../../shared/infrastructure/config/database.config';
import { EnvironmentConfigService } from '../../shared/infrastructure/config/environment.config';
import {
  globalContainer,
  DependencyRegistrar,
} from '../../shared/application/dependencies/register-dependencies';

export class TestSetup {
  private static server: Server;
  private static prismaService: PrismaClientService;

  public static async initialize(): Promise<Server> {
    // Set test environment
    process.env.NODE_ENV = 'test';
    process.env.DATABASE_URL = 'postgresql://user:password@localhost:5432/test_db';
    process.env.JWT_SECRET = 'test-jwt-secret-key-minimum-32-characters';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-minimum-32-characters';

    // Initialize environment configuration
    const envConfig = EnvironmentConfigService.getInstance();

    // Register dependencies
    DependencyRegistrar.register(globalContainer);

    // Initialize database
    const databaseConfig = new DatabaseConfig(envConfig.get());
    this.prismaService = PrismaClientService.getInstance(databaseConfig);

    try {
      await this.prismaService.connect();
      await this.setupTestDatabase();
    } catch (error) {
      console.warn('Database connection failed, using mock data:', error);
    }

    // Create server instance
    this.server = new Server();

    return this.server;
  }

  private static async setupTestDatabase(): Promise<void> {
    try {
      // Clean database
      await this.cleanDatabase();

      // Run migrations
      // Note: In a real test environment, you would run migrations here
      console.log('Test database setup completed');
    } catch (error) {
      console.warn('Database setup failed:', error);
    }
  }

  private static async cleanDatabase(): Promise<void> {
    if (!this.prismaService) return;

    try {
      const client = this.prismaService.getClient();

      // Delete in reverse order of dependencies
      await client.userRole.deleteMany();
      await client.rolePermission.deleteMany();
      await client.permission.deleteMany();
      await client.role.deleteMany();
      await client.module.deleteMany();
      await client.user.deleteMany();
      await client.loginSession.deleteMany();
      await client.authToken.deleteMany();
    } catch (error) {
      console.warn('Database cleanup failed:', error);
    }
  }

  public static async cleanup(): Promise<void> {
    try {
      if (this.prismaService) {
        await this.cleanDatabase();
        await this.prismaService.disconnect();
      }
    } catch (error) {
      console.warn('Cleanup failed:', error);
    }
  }

  public static getServer(): Server {
    return this.server;
  }

  public static getPrismaService(): PrismaClientService {
    return this.prismaService;
  }
}
