import cors, { CorsOptions } from 'cors';
import { EnvironmentConfigService } from '../../shared/infrastructure/config/environment.config';

export class CorsMiddleware {
  public static configure() {
    const envConfig = EnvironmentConfigService.getInstance().get();

    const corsOptions: CorsOptions = {
      origin: (origin, callback) => {
        // In development, allow all origins
        if (envConfig.NODE_ENV === 'development') {
          return callback(null, true);
        }

        // In production, you should specify allowed origins
        const allowedOrigins = [
          'http://localhost:3000',
          'http://localhost:3001',
          'http://localhost:8080',
        ];

        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
        'Cache-Control',
        'Pragma',
      ],
      exposedHeaders: ['X-Total-Count'],
      maxAge: 86400, // 24 hours
    };

    return cors(corsOptions);
  }
}
