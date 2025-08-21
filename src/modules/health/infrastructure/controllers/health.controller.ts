import { Request, Response } from 'express';
import { PrismaClientService } from '../../../../shared/infrastructure/database/prisma.client';
import { ApiResponse } from '../../../../shared/domain/wrappers/api-response.wrapper';
import { LoggerService } from '../../../../shared/infrastructure/logging/logger.service';
import { DateUtils } from '../../../../shared/infrastructure/utils/date.utils';
import os from 'os';
import process from 'process';

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  checks: {
    database: ComponentHealth;
    memory: ComponentHealth;
    disk?: ComponentHealth;
  };
}

export interface ReadinessStatus {
  ready: boolean;
  timestamp: string;
  checks: {
    database: boolean;
    migrations: boolean;
    requiredServices: boolean;
  };
}

export interface ComponentHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime?: number;
  message?: string;
  details?: Record<string, unknown>;
}

export class HealthController {
  private static readonly logger = LoggerService.getInstance();
  private static readonly startTime = Date.now();

  constructor(private readonly prismaService: PrismaClientService) {}

  public async health(req: Request, res: Response): Promise<void> {
    try {
      const healthStatus = await this.checkHealth();
      const statusCode = this.getStatusCode(healthStatus.status);

      const response = ApiResponse.success(healthStatus, 'Health check completed', statusCode);

      res.status(response.statusCode).json(response.toJSON());
    } catch (error) {
      HealthController.logger.error('Health check failed', error);

      const response = ApiResponse.internalError('Health check failed');
      res.status(response.statusCode).json(response.toJSON());
    }
  }

  public async liveness(req: Request, res: Response): Promise<void> {
    try {
      const response = ApiResponse.success(
        {
          status: 'alive',
          timestamp: DateUtils.utcNow(),
          uptime: process.uptime(),
          pid: process.pid,
        },
        'Service is alive'
      );

      res.status(response.statusCode).json(response.toJSON());
    } catch (error) {
      HealthController.logger.error('Liveness check failed', error);

      const response = ApiResponse.internalError('Liveness check failed');
      res.status(response.statusCode).json(response.toJSON());
    }
  }

  public async readiness(req: Request, res: Response): Promise<void> {
    try {
      const readinessStatus = await this.checkReadiness();
      const statusCode = readinessStatus.ready ? 200 : 503;

      const response = ApiResponse.success(
        readinessStatus,
        readinessStatus.ready ? 'Service is ready' : 'Service is not ready',
        statusCode
      );

      res.status(response.statusCode).json(response.toJSON());
    } catch (error) {
      HealthController.logger.error('Readiness check failed', error);

      const response = ApiResponse.internalError('Readiness check failed');
      res.status(response.statusCode).json(response.toJSON());
    }
  }

  public async metrics(req: Request, res: Response): Promise<void> {
    try {
      const metrics = this.collectMetrics();

      const response = ApiResponse.success(metrics, 'Metrics collected successfully');

      res.status(response.statusCode).json(response.toJSON());
    } catch (error) {
      HealthController.logger.error('Metrics collection failed', error);

      const response = ApiResponse.internalError('Metrics collection failed');
      res.status(response.statusCode).json(response.toJSON());
    }
  }

  private async checkHealth(): Promise<HealthStatus> {
    const [databaseHealth, memoryHealth] = await Promise.all([
      this.checkDatabase(),
      this.checkMemory(),
    ]);

    const overallStatus = this.determineOverallStatus([databaseHealth.status, memoryHealth.status]);

    return {
      status: overallStatus,
      timestamp: DateUtils.utcNow(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      checks: {
        database: databaseHealth,
        memory: memoryHealth,
      },
    };
  }

  private async checkReadiness(): Promise<ReadinessStatus> {
    const checks = {
      database: false,
      migrations: false,
      requiredServices: true, // Add more service checks as needed
    };

    try {
      // Check database connection
      const dbHealth = await this.checkDatabase();
      checks.database = dbHealth.status === 'healthy';

      // Check if migrations are up to date
      checks.migrations = await this.checkMigrations();
    } catch (error) {
      HealthController.logger.error('Readiness check error', error);
    }

    const ready = Object.values(checks).every(check => check === true);

    return {
      ready,
      timestamp: DateUtils.utcNow(),
      checks,
    };
  }

  private async checkDatabase(): Promise<ComponentHealth> {
    const startTime = Date.now();

    try {
      // Simple query to check database connectivity
      await this.prismaService.getClient().$queryRaw`SELECT 1`;
      const responseTime = Date.now() - startTime;

      return {
        status: responseTime < 100 ? 'healthy' : responseTime < 500 ? 'degraded' : 'unhealthy',
        responseTime,
        message: 'Database is responsive',
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        message: 'Database connection failed',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  private checkMemory(): ComponentHealth {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const memoryUsagePercent = (usedMemory / totalMemory) * 100;

    const processMemory = process.memoryUsage();
    const heapUsedPercent = (processMemory.heapUsed / processMemory.heapTotal) * 100;

    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    if (memoryUsagePercent > 90 || heapUsedPercent > 90) {
      status = 'unhealthy';
    } else if (memoryUsagePercent > 75 || heapUsedPercent > 75) {
      status = 'degraded';
    }

    return {
      status,
      message: `Memory usage: ${memoryUsagePercent.toFixed(2)}%`,
      details: {
        system: {
          total: totalMemory,
          free: freeMemory,
          used: usedMemory,
          percentUsed: memoryUsagePercent.toFixed(2),
        },
        process: {
          rss: processMemory.rss,
          heapTotal: processMemory.heapTotal,
          heapUsed: processMemory.heapUsed,
          heapUsedPercent: heapUsedPercent.toFixed(2),
          external: processMemory.external,
        },
      },
    };
  }

  private async checkMigrations(): Promise<boolean> {
    try {
      // Check if there are pending migrations
      // This is a simplified check - you may need to adjust based on your migration strategy
      const result = await this.prismaService.getClient().$queryRaw<Array<{ pending: number }>>`
        SELECT COUNT(*) as pending FROM _prisma_migrations WHERE finished_at IS NULL
      `;

      return result[0]?.pending === 0;
    } catch (error) {
      HealthController.logger.error('Migration check failed', error);
      return false;
    }
  }

  private collectMetrics(): Record<string, unknown> {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    return {
      timestamp: DateUtils.utcNow(),
      uptime: process.uptime(),
      memory: {
        rss: memoryUsage.rss,
        heapTotal: memoryUsage.heapTotal,
        heapUsed: memoryUsage.heapUsed,
        external: memoryUsage.external,
        arrayBuffers: memoryUsage.arrayBuffers,
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system,
      },
      system: {
        loadAverage: os.loadavg(),
        totalMemory: os.totalmem(),
        freeMemory: os.freemem(),
        cpus: os.cpus().length,
        platform: os.platform(),
        arch: os.arch(),
        nodeVersion: process.version,
      },
      process: {
        pid: process.pid,
        ppid: process.ppid,
        title: process.title,
        versions: process.versions,
      },
    };
  }

  private determineOverallStatus(
    statuses: Array<'healthy' | 'degraded' | 'unhealthy'>
  ): 'healthy' | 'degraded' | 'unhealthy' {
    if (statuses.includes('unhealthy')) {
      return 'unhealthy';
    }
    if (statuses.includes('degraded')) {
      return 'degraded';
    }
    return 'healthy';
  }

  private getStatusCode(status: 'healthy' | 'degraded' | 'unhealthy'): number {
    switch (status) {
      case 'healthy':
        return 200;
      case 'degraded':
        return 200; // Still return 200 for degraded, but the status indicates issues
      case 'unhealthy':
        return 503;
      default:
        return 500;
    }
  }
}
