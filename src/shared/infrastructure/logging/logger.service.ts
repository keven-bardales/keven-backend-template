import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import { EnvironmentConfigService } from '../config/environment.config';

export interface LogContext {
  userId?: string;
  requestId?: string;
  method?: string;
  url?: string;
  ip?: string;
  userAgent?: string;
  duration?: number;
  statusCode?: number;
  error?: Error | unknown;
  [key: string]: unknown;
}

export class LoggerService {
  private static instance: LoggerService;
  private logger: winston.Logger;
  private readonly isDevelopment: boolean;
  private readonly isProduction: boolean;

  private constructor() {
    const envConfig = EnvironmentConfigService.getInstance();
    this.isDevelopment = envConfig.isDevelopment();
    this.isProduction = envConfig.isProduction();

    this.logger = this.createLogger();
  }

  public static getInstance(): LoggerService {
    if (!LoggerService.instance) {
      LoggerService.instance = new LoggerService();
    }
    return LoggerService.instance;
  }

  private createLogger(): winston.Logger {
    const logDir = 'logs';

    const customFormat = winston.format.combine(
      winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss.SSS',
      }),
      winston.format.errors({ stack: true }),
      winston.format.metadata({
        fillExcept: ['message', 'level', 'timestamp', 'label'],
      })
    );

    const jsonFormat = winston.format.combine(customFormat, winston.format.json());

    const consoleFormat = winston.format.combine(
      customFormat,
      winston.format.colorize(),
      winston.format.printf(({ level, message, timestamp, metadata }) => {
        let output = `${timestamp} [${level}]: ${message}`;

        if (metadata && Object.keys(metadata).length > 0) {
          const { error, ...rest } = metadata as { error?: Error; [key: string]: unknown };

          if (Object.keys(rest).length > 0) {
            output += ` ${JSON.stringify(rest)}`;
          }

          if (error && error instanceof Error) {
            output += `\n${error.stack}`;
          }
        }

        return output;
      })
    );

    const transports: winston.transport[] = [];

    // Console transport
    transports.push(
      new winston.transports.Console({
        format: this.isDevelopment ? consoleFormat : jsonFormat,
        level: this.isDevelopment ? 'debug' : 'info',
      })
    );

    // File transports for production
    if (this.isProduction) {
      // Error log file - rotated daily
      transports.push(
        new DailyRotateFile({
          filename: path.join(logDir, 'error-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          level: 'error',
          format: jsonFormat,
          maxFiles: '30d',
          maxSize: '20m',
          zippedArchive: true,
        })
      );

      // Combined log file - rotated daily
      transports.push(
        new DailyRotateFile({
          filename: path.join(logDir, 'combined-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          format: jsonFormat,
          maxFiles: '14d',
          maxSize: '20m',
          zippedArchive: true,
        })
      );

      // Audit log file for security-sensitive operations
      transports.push(
        new DailyRotateFile({
          filename: path.join(logDir, 'audit-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          level: 'info',
          format: jsonFormat,
          maxFiles: '90d',
          maxSize: '20m',
          zippedArchive: true,
          auditFile: path.join(logDir, 'audit-log-audit.json'),
        })
      );
    }

    // Development file logs
    if (this.isDevelopment) {
      transports.push(
        new winston.transports.File({
          filename: path.join(logDir, 'error.log'),
          level: 'error',
          format: jsonFormat,
          maxsize: 5242880, // 5MB
          maxFiles: 5,
        })
      );

      transports.push(
        new winston.transports.File({
          filename: path.join(logDir, 'combined.log'),
          format: jsonFormat,
          maxsize: 5242880, // 5MB
          maxFiles: 5,
        })
      );
    }

    return winston.createLogger({
      level: process.env.LOG_LEVEL || (this.isDevelopment ? 'debug' : 'info'),
      format: customFormat,
      defaultMeta: {
        service: 'keven-backend-template',
        environment: process.env.NODE_ENV || 'development',
        version: process.env.npm_package_version || '1.0.0',
      },
      transports,
      exitOnError: false,
    });
  }

  // Standard logging methods
  public debug(message: string, context?: LogContext): void {
    this.logger.debug(message, this.sanitizeContext(context));
  }

  public info(message: string, context?: LogContext): void {
    this.logger.info(message, this.sanitizeContext(context));
  }

  public warn(message: string, context?: LogContext): void {
    this.logger.warn(message, this.sanitizeContext(context));
  }

  public error(message: string, error?: Error | unknown, context?: LogContext): void {
    const errorContext = {
      ...this.sanitizeContext(context),
      error: this.formatError(error),
    };

    this.logger.error(message, errorContext);
  }

  public fatal(message: string, error?: Error | unknown, context?: LogContext): void {
    const errorContext = {
      ...this.sanitizeContext(context),
      error: this.formatError(error),
      fatal: true,
    };

    this.logger.error(message, errorContext);
  }

  // Specialized logging methods
  public http(message: string, context: LogContext): void {
    this.logger.info(message, {
      ...this.sanitizeContext(context),
      type: 'http',
    });
  }

  public database(message: string, context?: LogContext): void {
    this.logger.debug(message, {
      ...this.sanitizeContext(context),
      type: 'database',
    });
  }

  public security(message: string, context?: LogContext): void {
    this.logger.warn(message, {
      ...this.sanitizeContext(context),
      type: 'security',
    });
  }

  public audit(message: string, context: LogContext): void {
    this.logger.info(message, {
      ...this.sanitizeContext(context),
      type: 'audit',
      timestamp: new Date().toISOString(),
    });
  }

  public performance(message: string, duration: number, context?: LogContext): void {
    this.logger.info(message, {
      ...this.sanitizeContext(context),
      type: 'performance',
      duration,
    });
  }

  // Utility methods
  private sanitizeContext(context?: LogContext): Record<string, unknown> {
    if (!context) return {};

    const sanitized: Record<string, unknown> = {};
    const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'authorization'];

    for (const [key, value] of Object.entries(context)) {
      if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
        sanitized[key] = '[REDACTED]';
      } else if (value instanceof Error) {
        sanitized[key] = this.formatError(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  private formatError(error?: Error | unknown): Record<string, unknown> | undefined {
    if (!error) return undefined;

    if (error instanceof Error) {
      return {
        name: error.name,
        message: error.message,
        stack: error.stack,
        ...((error as any).code && { code: (error as any).code }),
      };
    }

    return {
      message: String(error),
      type: typeof error,
    };
  }

  public child(defaultContext: LogContext): LoggerService {
    const childLogger = Object.create(this);
    childLogger.logger = this.logger.child(defaultContext);
    return childLogger;
  }

  public profile(id: string): void {
    this.logger.profile(id);
  }

  public startTimer(): () => void {
    const start = Date.now();
    return () => {
      const duration = Date.now() - start;
      return duration;
    };
  }

  // Stream for Morgan HTTP logger
  public get stream() {
    return {
      write: (message: string) => {
        this.http(message.trim(), {});
      },
    };
  }
}
