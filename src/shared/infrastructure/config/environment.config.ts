import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const EnvironmentSchema = z.object({
  // Application
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z
    .string()
    .default('3000')
    .transform(val => parseInt(val, 10)),

  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  // JWT
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // Security
  BCRYPT_SALT_ROUNDS: z
    .string()
    .default('12')
    .transform(val => parseInt(val, 10)),

  // Super Admin
  SUPER_ADMIN_EMAIL: z.string().email().default('admin@example.com'),
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
