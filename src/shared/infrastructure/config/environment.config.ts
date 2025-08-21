import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const EnvironmentSchema = z.object({
  // Application
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z
    .string()
    .default('3000')
    .transform(val => parseInt(val, 10))
    .refine(val => val >= 1 && val <= 65535, 'PORT must be between 1 and 65535'),

  // Database
  DATABASE_URL: z
    .string()
    .min(1, 'DATABASE_URL is required')
    .refine(
      val => val.includes('postgresql://') || val.includes('postgres://'),
      'DATABASE_URL must be a valid PostgreSQL connection string'
    ),

  // JWT
  JWT_ACCESS_SECRET: z
    .string()
    .min(32, 'JWT_ACCESS_SECRET must be at least 32 characters')
    .refine(
      val => !/^(secret|password|123|test|dev)/.test(val.toLowerCase()),
      'JWT_ACCESS_SECRET must not be a common weak secret'
    ),
  JWT_REFRESH_SECRET: z
    .string()
    .min(32, 'JWT_REFRESH_SECRET must be at least 32 characters')
    .refine(
      val => !/^(secret|password|123|test|dev)/.test(val.toLowerCase()),
      'JWT_REFRESH_SECRET must not be a common weak secret'
    ),
  JWT_ACCESS_EXPIRES_IN: z
    .string()
    .default('10m')
    .refine(
      val => /^\d+[smhd]$/.test(val),
      'JWT_ACCESS_EXPIRES_IN must be in format: number + s/m/h/d (e.g., "10m")'
    ),
  JWT_REFRESH_EXPIRES_IN: z
    .string()
    .default('7d')
    .refine(
      val => /^\d+[smhd]$/.test(val),
      'JWT_REFRESH_EXPIRES_IN must be in format: number + s/m/h/d (e.g., "7d")'
    ),

  // Security
  BCRYPT_SALT_ROUNDS: z
    .string()
    .default('12')
    .transform(val => parseInt(val, 10))
    .refine(
      val => val >= 10 && val <= 15,
      'BCRYPT_SALT_ROUNDS must be between 10 and 15 for optimal security'
    ),

  // Super Admin
  SUPER_ADMIN_EMAIL: z
    .string()
    .email('SUPER_ADMIN_EMAIL must be a valid email address')
    .default('admin@example.com'),

  // Optional: Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),

  // Optional: Rate Limiting
  RATE_LIMIT_WINDOW_MS: z
    .string()
    .default('900000')
    .transform(val => parseInt(val, 10)),
  RATE_LIMIT_MAX_REQUESTS: z
    .string()
    .default('100')
    .transform(val => parseInt(val, 10)),

  // Optional: CORS
  CORS_ORIGINS: z.string().optional(),
  CORS_CREDENTIALS: z
    .string()
    .default('false')
    .transform(val => val.toLowerCase() === 'true'),

  // Optional: Security Headers
  TRUST_PROXY: z
    .string()
    .default('false')
    .transform(val => val.toLowerCase() === 'true'),

  // Optional: Health Check
  HEALTH_CHECK_ENABLED: z
    .string()
    .default('true')
    .transform(val => val.toLowerCase() === 'true'),

  // Optional: Swagger Documentation
  SWAGGER_ENABLED: z
    .string()
    .default('true')
    .transform(val => val.toLowerCase() === 'true'),

  // Optional: Database Connection Pool
  DB_POOL_MIN: z
    .string()
    .default('2')
    .transform(val => parseInt(val, 10)),
  DB_POOL_MAX: z
    .string()
    .default('10')
    .transform(val => parseInt(val, 10)),

  // Optional: Request Timeout
  REQUEST_TIMEOUT_MS: z
    .string()
    .default('30000')
    .transform(val => parseInt(val, 10)),

  // Optional: File Upload Limits
  MAX_FILE_SIZE_MB: z
    .string()
    .default('10')
    .transform(val => parseInt(val, 10)),

  // Optional: Session Configuration
  SESSION_TIMEOUT_MINUTES: z
    .string()
    .default('60')
    .transform(val => parseInt(val, 10)),
});

export type EnvironmentConfig = z.infer<typeof EnvironmentSchema>;

export class EnvironmentConfigService {
  private static instance: EnvironmentConfigService;
  private readonly config: EnvironmentConfig;

  private constructor() {
    try {
      this.config = EnvironmentSchema.parse(process.env);
      this.logConfiguration();
    } catch (error) {
      console.error('❌ Environment configuration validation failed:', error);
      if (error instanceof z.ZodError) {
        console.error('Missing or invalid environment variables:');
        error.issues.forEach((err: any) => {
          console.error(`- ${err.path.join('.')}: ${err.message}`);
        });
      }
      process.exit(1);
    }
  }

  public static getInstance(): EnvironmentConfigService {
    if (!EnvironmentConfigService.instance) {
      EnvironmentConfigService.instance = new EnvironmentConfigService();
    }
    return EnvironmentConfigService.instance;
  }

  public get(): EnvironmentConfig {
    return this.config;
  }

  public isDevelopment(): boolean {
    return this.config.NODE_ENV === 'development';
  }

  public isProduction(): boolean {
    return this.config.NODE_ENV === 'production';
  }

  public isTest(): boolean {
    return this.config.NODE_ENV === 'test';
  }

  private logConfiguration(): void {
    console.log('🔧 Environment Configuration:');
    console.log(`  NODE_ENV: ${this.config.NODE_ENV}`);
    console.log(`  PORT: ${this.config.PORT}`);
    console.log(`  DATABASE_URL: ${this.maskSensitiveData(this.config.DATABASE_URL)}`);
    console.log(`  JWT_ACCESS_EXPIRES_IN: ${this.config.JWT_ACCESS_EXPIRES_IN}`);
    console.log(`  JWT_REFRESH_EXPIRES_IN: ${this.config.JWT_REFRESH_EXPIRES_IN}`);
    console.log(`  BCRYPT_SALT_ROUNDS: ${this.config.BCRYPT_SALT_ROUNDS}`);
    console.log(`  SUPER_ADMIN_EMAIL: ${this.config.SUPER_ADMIN_EMAIL}`);
    console.log(`  LOG_LEVEL: ${this.config.LOG_LEVEL}`);
    console.log(`  RATE_LIMIT_MAX_REQUESTS: ${this.config.RATE_LIMIT_MAX_REQUESTS}`);
    console.log(`  HEALTH_CHECK_ENABLED: ${this.config.HEALTH_CHECK_ENABLED}`);
    console.log(`  SWAGGER_ENABLED: ${this.config.SWAGGER_ENABLED}`);
    console.log(`  DB_POOL_MIN/MAX: ${this.config.DB_POOL_MIN}/${this.config.DB_POOL_MAX}`);
    console.log(`  TRUST_PROXY: ${this.config.TRUST_PROXY}`);

    // Security warnings for development
    if (this.isDevelopment()) {
      console.log('⚠️  Development mode - security warnings:');
      if (this.config.JWT_ACCESS_SECRET.length < 64) {
        console.log('  - Consider using a longer JWT_ACCESS_SECRET (64+ characters)');
      }
      if (this.config.JWT_REFRESH_SECRET.length < 64) {
        console.log('  - Consider using a longer JWT_REFRESH_SECRET (64+ characters)');
      }
    }

    // Production security validations
    if (this.isProduction()) {
      this.validateProductionSecurity();
    }
  }

  private validateProductionSecurity(): void {
    const warnings: string[] = [];

    if (this.config.JWT_ACCESS_SECRET.length < 64) {
      warnings.push('JWT_ACCESS_SECRET should be at least 64 characters in production');
    }

    if (this.config.JWT_REFRESH_SECRET.length < 64) {
      warnings.push('JWT_REFRESH_SECRET should be at least 64 characters in production');
    }

    if (this.config.BCRYPT_SALT_ROUNDS < 12) {
      warnings.push('BCRYPT_SALT_ROUNDS should be at least 12 in production');
    }

    if (this.config.SUPER_ADMIN_EMAIL === 'admin@example.com') {
      warnings.push('SUPER_ADMIN_EMAIL should not use the default value in production');
    }

    if (!this.config.CORS_ORIGINS) {
      warnings.push('CORS_ORIGINS should be explicitly set in production');
    }

    if (warnings.length > 0) {
      console.log('⚠️  Production security warnings:');
      warnings.forEach(warning => console.log(`  - ${warning}`));
    }
  }

  private maskSensitiveData(value: string): string {
    if (value.length <= 10) {
      return '*'.repeat(value.length);
    }
    return (
      value.substring(0, 5) + '*'.repeat(value.length - 10) + value.substring(value.length - 5)
    );
  }
}
