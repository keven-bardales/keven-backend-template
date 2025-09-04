@echo off
echo ========================================
echo   Keven Backend Template - Production
echo ========================================
echo.

REM Check if Docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker is not installed or not in PATH
    echo Please install Docker from https://www.docker.com/
    pause
    exit /b 1
)

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker daemon is not running
    echo Please start Docker and try again
    pause
    exit /b 1
)

REM Check if .env file exists
if not exist .env (
    echo ERROR: .env file not found
    echo Please create .env file with production configuration
    echo You can use .env.example as a template
    pause
    exit /b 1
)

echo WARNING: This will start the production environment
echo Make sure your .env file contains production settings!
echo.
echo Press Ctrl+C to cancel or any other key to continue...
pause >nul

echo Starting production environment...
echo.
echo This will:
echo - Start PostgreSQL database
echo - Start backend API in production mode
echo - Available at http://localhost:3000
echo.

REM Start Docker Compose with production configuration in detached mode
docker-compose -f docker-compose.prod.yml up -d --build

echo.
echo Production environment started in background.
echo.
echo To view logs: docker-compose -f docker-compose.prod.yml logs -f
echo To stop: docker-compose -f docker-compose.prod.yml down
echo.
pause