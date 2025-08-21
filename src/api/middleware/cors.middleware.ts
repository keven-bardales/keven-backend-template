import cors, { CorsOptions } from 'cors';
import { EnvironmentConfigService } from '../../shared/infrastructure/config/environment.config';
import { LoggerService } from '../../shared/infrastructure/logging/logger.service';

export class CorsMiddleware {
  private static readonly logger = LoggerService.getInstance();

  public static configure() {
    const envConfig = EnvironmentConfigService.getInstance().get();

    const corsOptions: CorsOptions = {
      origin: (origin, callback) => {
        const allowedOrigins = CorsMiddleware.getAllowedOrigins(envConfig);

        // In development, allow all origins but log them for security awareness
        if (envConfig.NODE_ENV === 'development') {
          if (origin) {
            CorsMiddleware.logger.debug('CORS: Allowing development origin', { origin });
          }
          return callback(null, true);
        }

        // In production/test, strictly validate origins
        if (!origin) {
          // Allow requests with no origin (e.g., mobile apps, Postman)
          // But log for security monitoring
          CorsMiddleware.logger.warn('CORS: Request with no origin allowed', {
            userAgent: 'N/A', // Could be enhanced to get from request
          });
          return callback(null, true);
        }

        if (allowedOrigins.includes(origin)) {
          CorsMiddleware.logger.debug('CORS: Allowed origin', { origin });
          callback(null, true);
        } else {
          CorsMiddleware.logger.security('CORS: Blocked unauthorized origin', {
            origin,
            environment: envConfig.NODE_ENV,
            allowedOrigins,
          });
          callback(new Error(`Origin ${origin} not allowed by CORS policy`));
        }
      },
      credentials: envConfig.CORS_CREDENTIALS,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
      allowedHeaders: [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
        'Cache-Control',
        'Pragma',
        'X-Request-Id',
        'X-Correlation-Id',
        'X-Client-Version',
        'X-API-Version',
        // Security headers
        'X-CSRF-Token',
        'X-Requested-With',
      ],
      exposedHeaders: [
        'X-Total-Count',
        'X-Request-Id',
        'X-Rate-Limit-Limit',
        'X-Rate-Limit-Remaining',
        'X-Rate-Limit-Reset',
        'Location',
      ],
      // Preflight cache: 1 hour in production, 5 minutes in development
      maxAge: envConfig.NODE_ENV === 'production' ? 3600 : 300,
      // Only set to true for development, false for production unless explicitly needed
      optionsSuccessStatus: 200,
    };

    return cors(corsOptions);
  }

  private static getAllowedOrigins(envConfig: any): string[] {
    // Parse CORS_ORIGINS from environment variable
    if (envConfig.CORS_ORIGINS) {
      const origins = envConfig.CORS_ORIGINS.split(',').map((origin: string) => origin.trim());
      CorsMiddleware.logger.info('CORS: Using configured origins', { origins });
      return origins;
    }

    // Fallback defaults based on environment
    const defaultOrigins = {
      production: [
        // Add your production domains here
        'https://yourdomain.com',
        'https://www.yourdomain.com',
        'https://app.yourdomain.com',
      ],
      development: [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:8080',
        'http://localhost:4200', // Angular dev server
        'http://localhost:5173', // Vite dev server
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3001',
      ],
      test: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    };

    const origins =
      defaultOrigins[envConfig.NODE_ENV as keyof typeof defaultOrigins] ||
      defaultOrigins.development;

    if (envConfig.NODE_ENV === 'production') {
      CorsMiddleware.logger.warn(
        'CORS: Using default production origins. Consider setting CORS_ORIGINS environment variable.',
        {
          origins,
        }
      );
    }

    return origins;
  }

  /**
   * Create a more restrictive CORS policy for sensitive endpoints
   */
  public static configureStrict() {
    const envConfig = EnvironmentConfigService.getInstance().get();

    const strictCorsOptions: CorsOptions = {
      origin: (origin, callback) => {
        // Strict mode: only allow specific, verified origins
        const allowedOrigins = envConfig.CORS_ORIGINS?.split(',').map(o => o.trim()) || [];

        if (envConfig.NODE_ENV === 'development') {
          // Still strict in development, but allow localhost
          const devOrigins = ['http://localhost:3000', 'http://127.0.0.1:3000', ...allowedOrigins];

          if (!origin || devOrigins.includes(origin)) {
            return callback(null, true);
          }
        } else {
          // Production: very strict
          if (origin && allowedOrigins.includes(origin)) {
            return callback(null, true);
          }
        }

        CorsMiddleware.logger.security('CORS STRICT: Blocked origin', {
          origin,
          allowedOrigins,
          environment: envConfig.NODE_ENV,
        });
        callback(new Error('Strict CORS policy: Origin not allowed'));
      },
      credentials: true, // Always true for strict mode
      methods: ['POST', 'PUT', 'DELETE'], // Only mutating operations
      allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Request-Id'],
      maxAge: 0, // No preflight caching for strict mode
      optionsSuccessStatus: 204,
    };

    return cors(strictCorsOptions);
  }

  /**
   * CORS configuration for public read-only endpoints
   */
  public static configurePublic() {
    const corsOptions: CorsOptions = {
      origin: '*', // Allow all origins for public endpoints
      credentials: false, // No credentials for public endpoints
      methods: ['GET', 'HEAD', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Accept', 'X-Request-Id'],
      maxAge: 86400, // 24 hours cache for public endpoints
    };

    return cors(corsOptions);
  }
}
