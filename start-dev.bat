@echo off
echo ========================================
echo   Keven Backend Template - Development
echo ========================================
echo.

REM Check if Docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker is not installed or not in PATH
    echo Please install Docker Desktop from https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker daemon is not running
    echo Please start Docker Desktop and try again
    pause
    exit /b 1
)

REM Check if .env file exists, if not copy from .env.example
if not exist .env (
    if exist .env.example (
        echo Creating .env file from .env.example...
        copy .env.example .env >nul
        echo.
        echo IMPORTANT: Please edit .env file with your configuration before continuing
        echo Press any key to continue after editing .env file...
        pause >nul
    ) else (
        echo ERROR: .env.example file not found
        echo Please create .env.example file first
        pause
        exit /b 1
    )
)

echo Starting development environment...
echo.
echo This will:
echo - Start PostgreSQL database (data persists between restarts)
echo - Start backend API with hot reload
echo - Available at http://localhost:3000
echo - Swagger docs at http://localhost:3000/api/docs
echo.

REM Start Docker Compose with development configuration
docker-compose -f docker-compose.dev.yml up --build

echo.
echo Development environment stopped.
pause