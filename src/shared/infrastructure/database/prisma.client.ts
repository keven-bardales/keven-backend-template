import { PrismaClient } from '@prisma/client';
import { DatabaseConfig } from '../config/database.config';

export class PrismaClientService {
  private static instance: PrismaClientService;
  private client: PrismaClient;
  private isConnected: boolean = false;

  private constructor(databaseConfig: DatabaseConfig) {
    this.client = new PrismaClient({
      datasources: {
        db: {
          url: databaseConfig.getUrl(),
        },
      },
      log: databaseConfig.shouldLogQueries()
        ? [
            { level: 'query', emit: 'stdout' },
            { level: 'info', emit: 'stdout' },
            { level: 'warn', emit: 'stdout' },
            { level: 'error', emit: 'stdout' },
          ]
        : ['error'],
    });

    this.setupEventHandlers();
  }

  public static getInstance(databaseConfig?: DatabaseConfig): PrismaClientService {
    if (!PrismaClientService.instance) {
      if (!databaseConfig) {
        throw new Error('DatabaseConfig is required for the first initialization');
      }
      PrismaClientService.instance = new PrismaClientService(databaseConfig);
    }
    return PrismaClientService.instance;
  }

  public getClient(): PrismaClient {
    return this.client;
  }

  public async connect(): Promise<void> {
    if (this.isConnected) {
      return;
    }

    try {
      await this.client.$connect();
      this.isConnected = true;
      console.log('✅ Database connected successfully');
    } catch (error) {
      console.error('❌ Failed to connect to database:', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      await this.client.$disconnect();
      this.isConnected = false;
      console.log('✅ Database disconnected successfully');
    } catch (error) {
      console.error('❌ Failed to disconnect from database:', error);
      throw error;
    }
  }

  public async healthCheck(): Promise<boolean> {
    try {
      await this.client.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      console.error('❌ Database health check failed:', error);
      return false;
    }
  }

  public isConnectionActive(): boolean {
    return this.isConnected;
  }

  private setupEventHandlers(): void {
    // Remove the beforeExit handler as it's not available in PrismaClient
    // The process handlers below will handle cleanup

    // Handle process termination
    process.on('SIGINT', async () => {
      console.log('🔄 Received SIGINT, shutting down gracefully...');
      await this.disconnect();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.log('🔄 Received SIGTERM, shutting down gracefully...');
      await this.disconnect();
      process.exit(0);
    });

    process.on('beforeExit', async () => {
      console.log('🔄 Process is exiting, disconnecting from database...');
      await this.disconnect();
    });
  }
}
