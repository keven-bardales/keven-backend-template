import { EnvironmentConfig } from './environment.config';

export interface DatabaseConnectionOptions {
  url: string;
  maxConnections?: number;
  connectionTimeout?: number;
  queryTimeout?: number;
  logQueries?: boolean;
}

export class DatabaseConfig {
  private readonly options: DatabaseConnectionOptions;

  constructor(environmentConfig: EnvironmentConfig) {
    this.options = {
      url: environmentConfig.DATABASE_URL,
      maxConnections: 10,
      connectionTimeout: 30000, // 30 seconds
      queryTimeout: 10000, // 10 seconds
      logQueries: environmentConfig.NODE_ENV === 'development',
    };
  }

  public getConnectionOptions(): DatabaseConnectionOptions {
    return { ...this.options };
  }

  public getUrl(): string {
    return this.options.url;
  }

  public shouldLogQueries(): boolean {
    return this.options.logQueries || false;
  }

  public getMaxConnections(): number {
    return this.options.maxConnections || 10;
  }

  public getConnectionTimeout(): number {
    return this.options.connectionTimeout || 30000;
  }

  public getQueryTimeout(): number {
    return this.options.queryTimeout || 10000;
  }

  public validateConnection(): void {
    if (!this.options.url) {
      throw new Error('Database URL is not configured');
    }

    try {
      new URL(this.options.url);
    } catch {
      throw new Error('Invalid database URL format');
    }

    console.log('✅ Database configuration is valid');
  }
}
