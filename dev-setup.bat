@echo off
REM Keven Backend Template - Development Setup Script for Windows
REM This script sets up the development environment with Docker

setlocal enabledelayedexpansion

echo 🚀 Setting up Keven Backend Template Development Environment...
echo ================================================

REM Check if Docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not installed. Please install Docker Desktop first.
    pause
    exit /b 1
)

REM Check if Docker Compose is installed
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker Compose is not installed. Please install Docker Compose first.
    pause
    exit /b 1
)

echo ✅ Docker and Docker Compose are installed

REM Create necessary directories
echo 📁 Creating necessary directories...
if not exist "logs" mkdir logs
if not exist "database" mkdir database

REM Check if .env.dev exists, create if not
if not exist ".env.dev" (
    echo 📝 Creating .env.dev file...
    (
        echo # Development Environment Variables
        echo NODE_ENV=development
        echo PORT=3000
        echo.
        echo # Database Configuration
        echo DATABASE_URL=postgresql://dev_user:dev_password@postgres-dev:5432/keven_dev_db
        echo POSTGRES_USER=dev_user
        echo POSTGRES_PASSWORD=dev_password
        echo POSTGRES_DB=keven_dev_db
        echo.
        echo # JWT Configuration ^(Development keys - DO NOT use in production^)
        echo JWT_ACCESS_SECRET=h7K9mL2nP5qR8sT1uV4wX7yZ0aB3cD6eF9gH2iJ5kL8mN1oP4qR7sT0uV3wX6yZ9a
        echo JWT_REFRESH_SECRET=m4N7pQ0rS3tU6vW9xY2zA5bC8dE1fG4hI7jK0lM3nO6pQ9rS2tU5vW8xY1zA4bC7dE0f
        echo JWT_ACCESS_EXPIRES_IN=15m
        echo JWT_REFRESH_EXPIRES_IN=7d
        echo.
        echo # Bcrypt Configuration
        echo BCRYPT_SALT_ROUNDS=10
        echo.
        echo # Super Admin Configuration
        echo SUPER_ADMIN_EMAIL=admin@dev.local
        echo.
        echo # CORS Configuration
        echo CORS_ORIGINS=http://localhost:3001,http://localhost:4200,http://localhost:5173,http://127.0.0.1:3001,http://127.0.0.1:4200
        echo CORS_CREDENTIALS=true
        echo.
        echo # Logging Configuration
        echo LOG_LEVEL=debug
        echo.
        echo # API Configuration
        echo SWAGGER_ENABLED=true
        echo API_VERSION=v1
        echo.
        echo # Development Tools
        echo HOT_RELOAD=true
    ) > .env.dev
    echo ✅ .env.dev file created
) else (
    echo ✅ .env.dev file already exists
)

if "%1"=="stop" goto :stop_dev
if "%1"=="restart" goto :restart_dev
if "%1"=="clean" goto :clean_dev
if "%1"=="logs" goto :logs_dev
if "%1"=="tools" goto :tools_dev
if "%1"=="reset-db" goto :reset_db

:start_dev
echo 🐳 Starting development environment...
docker-compose -f docker-compose.dev.yml up --build -d

echo ⏳ Waiting for services to be healthy...
timeout /t 10 /nobreak >nul

REM Wait for database to be ready
echo 🗄️  Waiting for database to be ready...
:db_wait
docker-compose -f docker-compose.dev.yml exec -T postgres-dev pg_isready -U dev_user -d keven_dev_db >nul 2>&1
if %errorlevel% neq 0 (
    timeout /t 2 /nobreak >nul
    goto :db_wait
)

echo 🔄 Applying database migrations (non-destructive)...
docker-compose -f docker-compose.dev.yml exec -T backend-dev npm run db:deploy

echo 🌱 Checking if database needs seeding...
docker-compose -f docker-compose.dev.yml exec -T backend-dev npm run db:seed:check

echo.
echo 🎉 Development environment is ready!
echo ================================================
echo 🌐 Backend API: http://localhost:3000
echo 📚 API Documentation: http://localhost:3000/api/docs
echo 💚 Health Check: http://localhost:3000/api/health
echo 🗄️  Database ^(Adminer^): http://localhost:8080
echo 📊 Redis Commander: http://localhost:8081
echo.
echo Database credentials:
echo   Host: localhost:5432
echo   User: dev_user
echo   Password: dev_password
echo   Database: keven_dev_db
echo.
echo Redis:
echo   Host: localhost:6379
echo.
echo To view logs: dev-setup.bat logs
echo To stop: dev-setup.bat stop
echo ================================================
goto :end

:stop_dev
echo 🛑 Stopping development environment...
docker-compose -f docker-compose.dev.yml down
echo ✅ Development environment stopped
goto :end

:restart_dev
echo 🔄 Restarting development environment...
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml up --build -d
echo ✅ Development environment restarted
goto :end

:clean_dev
echo 🧹 Cleaning development environment...
docker-compose -f docker-compose.dev.yml down -v
docker system prune -f
echo ✅ Development environment cleaned
goto :end

:logs_dev
docker-compose -f docker-compose.dev.yml logs -f backend-dev
goto :end

:tools_dev
echo 🛠️  Starting development tools...
docker-compose -f docker-compose.dev.yml --profile tools up -d adminer redis-commander
echo 🗄️  Adminer: http://localhost:8080
echo 📊 Redis Commander: http://localhost:8081
goto :end

:reset_db
echo ⚠️  WARNING: This will reset the database and delete all data!
echo Press any key to continue or Ctrl+C to cancel...
pause >nul
echo 🗑️  Resetting database...
docker-compose -f docker-compose.dev.yml exec -T backend-dev npm run db:reset
echo ✅ Database reset completed
goto :end

:help
echo Usage: dev-setup.bat [start^|stop^|restart^|clean^|logs^|tools^|reset-db]
echo.
echo Commands:
echo   start    - Start the development environment ^(default^)
echo   stop     - Stop the development environment
echo   restart  - Restart the development environment
echo   clean    - Clean all containers and volumes
echo   logs     - Show backend logs
echo   tools    - Start development tools ^(Adminer, Redis Commander^)
echo   reset-db - Reset database ^(WARNING: deletes all data^)
goto :end

:end
if "%1"=="" pause