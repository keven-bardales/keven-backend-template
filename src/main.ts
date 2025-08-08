import 'reflect-metadata';
import { Server } from './api/server';
import { EnvironmentConfigService } from './shared/infrastructure/config/environment.config';
import {
  globalContainer,
  DependencyRegistrar,
} from './shared/application/dependencies/register-dependencies';

async function bootstrap(): Promise<void> {
  try {
    console.log('🚀 Starting Keven Backend Template...');
    console.log('================================================');

    // Initialize environment configuration
    console.log('⚙️  Initializing environment configuration...');
    const envConfig = EnvironmentConfigService.getInstance();
    console.log('✅ Environment configuration loaded');

    // Register dependencies
    console.log('📦 Registering dependencies...');
    DependencyRegistrar.register(globalContainer);
    console.log('✅ Dependencies registered');

    // Create and start server
    console.log('🖥️  Initializing server...');
    const server = new Server();
    await server.start();

    console.log('================================================');
    console.log('🎉 Keven Backend Template started successfully!');
  } catch (error) {
    console.error('================================================');
    console.error('❌ Failed to start application:', error);
    console.error('================================================');
    process.exit(1);
  }
}

// Handle unhandled rejections and exceptions at the application level
process.on('uncaughtException', (error: Error) => {
  console.error('🚨 Uncaught Exception at application level:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  console.error('🚨 Unhandled Rejection at application level:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the application
bootstrap().catch(error => {
  console.error('❌ Bootstrap failed:', error);
  process.exit(1);
});
