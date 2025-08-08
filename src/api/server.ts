import express, { Application, Request, Response, NextFunction } from 'express';
import { EnvironmentConfigService } from '../shared/infrastructure/config/environment.config';
import { DatabaseConfig } from '../shared/infrastructure/config/database.config';
import { PrismaClientService } from '../shared/infrastructure/database/prisma.client';
import { ErrorHandlerMiddleware } from '../shared/application/middleware/error-handler.middleware';
import { CorsMiddleware } from './middleware/cors.middleware';
import { CompressionMiddleware } from './middleware/compression.middleware';
import { createApiRoutes } from './routes/index';
import { ApiResponse } from '../shared/domain/wrappers/api-response.wrapper';
import { SwaggerService } from '../shared/infrastructure/swagger/swagger.service';

export class Server {
  private readonly app: Application;
  private readonly port: number;
  private prismaService: PrismaClientService | null = null;

  constructor() {
    this.app = express();
    this.port = EnvironmentConfigService.getInstance().get().PORT;
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddlewares(): void {
    console.log('🔧 Initializing middlewares...');

    // Security and performance middlewares
    this.app.use(CorsMiddleware.configure());
    this.app.use(CompressionMiddleware.configure());

    // Body parsing middlewares
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging middleware (development only)
    if (EnvironmentConfigService.getInstance().isDevelopment()) {
      this.app.use((req: Request, res: Response, next: NextFunction) => {
        const start = Date.now();

        res.on('finish', () => {
          const duration = Date.now() - start;
          console.log(`${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
        });

        next();
      });
    }

    // Setup Swagger documentation
    SwaggerService.setup(this.app);

    console.log('✅ Middlewares initialized');
  }

  private initializeRoutes(): void {
    console.log('🛣️  Initializing routes...');

    // API routes
    this.app.use('/api', createApiRoutes());

    // Root endpoint
    this.app.get('/', (req: Request, res: Response) => {
      const response = ApiResponse.success(
        {
          name: 'Keven Backend Template',
          version: process.env.npm_package_version || '1.0.0',
          status: 'running',
          environment: process.env.NODE_ENV || 'development',
          timestamp: new Date().toISOString(),
          endpoints: {
            api: '/api',
            health: '/api/health',
            docs: '/api/docs',
          },
        },
        'Server is running successfully'
      );

      res.status(response.statusCode).json(response.toJSON());
    });

    // Handle 404 errors
    // this.app.use('*', (req: Request, res: Response) => {
    //   const response = ApiResponse.notFound(`Cannot ${req.method} ${req.originalUrl}`);
    //   res.status(response.statusCode).json(response.toJSON());
    // });

    console.log('✅ Routes initialized');
  }

  private initializeErrorHandling(): void {
    console.log('🚨 Initializing error handling...');

    // Global error handler (must be last middleware)
    this.app.use(ErrorHandlerMiddleware.handle);

    // Handle uncaught exceptions
    process.on('uncaughtException', (error: Error) => {
      console.error('🚨 Uncaught Exception:', error);
      this.gracefulShutdown('uncaughtException');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
      console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
      this.gracefulShutdown('unhandledRejection');
    });

    // Handle SIGTERM
    process.on('SIGTERM', () => {
      console.log('🔄 SIGTERM received, shutting down gracefully...');
      this.gracefulShutdown('SIGTERM');
    });

    // Handle SIGINT
    process.on('SIGINT', () => {
      console.log('🔄 SIGINT received, shutting down gracefully...');
      this.gracefulShutdown('SIGINT');
    });

    console.log('✅ Error handling initialized');
  }

  public async start(): Promise<void> {
    try {
      console.log('🚀 Starting server...');

      // Initialize database connection
      await this.initializeDatabase();

      // Start HTTP server
      const server = this.app.listen(this.port, () => {
        console.log('✅ Server started successfully');
        console.log(`🌐 Server is running on port ${this.port}`);
        console.log(`🔗 API URL: http://localhost:${this.port}/api`);
        console.log(`💚 Health check: http://localhost:${this.port}/api/health`);
        console.log(`📚 Environment: ${process.env.NODE_ENV || 'development'}`);
      });

      // Handle server errors
      server.on('error', (error: any) => {
        if (error.code === 'EADDRINUSE') {
          console.error(`❌ Port ${this.port} is already in use`);
        } else {
          console.error('❌ Server error:', error);
        }
        process.exit(1);
      });
    } catch (error) {
      console.error('❌ Failed to start server:', error);
      process.exit(1);
    }
  }

  private async initializeDatabase(): Promise<void> {
    try {
      console.log('🗄️  Initializing database connection...');

      const envConfig = EnvironmentConfigService.getInstance().get();
      const databaseConfig = new DatabaseConfig(envConfig);

      // Validate database configuration
      databaseConfig.validateConnection();

      // Initialize Prisma client service
      this.prismaService = PrismaClientService.getInstance(databaseConfig);

      // Connect to database
      await this.prismaService.connect();

      // Perform health check
      const isHealthy = await this.prismaService.healthCheck();
      if (!isHealthy) {
        throw new Error('Database health check failed');
      }

      console.log('✅ Database connection initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize database:', error);
      throw error;
    }
  }

  private async gracefulShutdown(signal: string): Promise<void> {
    console.log(`🔄 Graceful shutdown initiated due to ${signal}`);

    try {
      // Close database connection
      if (this.prismaService) {
        await this.prismaService.disconnect();
        console.log('✅ Database connection closed');
      }

      console.log('✅ Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      console.error('❌ Error during graceful shutdown:', error);
      process.exit(1);
    }
  }

  public getApp(): Application {
    return this.app;
  }
}
