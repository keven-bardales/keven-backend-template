@echo off
REM Keven Backend Template - Local Development Setup Script (Windows)
REM This script sets up the local development environment

setlocal enabledelayedexpansion

echo 🚀 Setting up Keven Backend Template for Local Development
echo ========================================================

REM Check if Node.js is installed
echo 🔍 Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/
    pause
    exit /b 1
)

for /f "tokens=1" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✅ Node.js %NODE_VERSION% is installed

REM Check if PostgreSQL is installed (optional)
echo 🔍 Checking PostgreSQL installation...
psql --version >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=3" %%i in ('psql --version') do set PG_VERSION=%%i
    echo ✅ PostgreSQL !PG_VERSION! is installed
    set HAS_POSTGRES=true
) else (
    echo ⚠️  PostgreSQL is not installed locally
    echo 💡 You can either:
    echo   1. Install PostgreSQL locally
    echo   2. Use Docker for just the database:
    echo      docker run -d --name postgres-dev -e POSTGRES_USER=keven_user -e POSTGRES_PASSWORD=your_password -e POSTGRES_DB=keven_dev_db -p 5432:5432 postgres:15-alpine
    echo   3. Use the full Docker development setup: npm run docker:dev
    set HAS_POSTGRES=false
)

REM Create environment file
echo 📝 Setting up environment file...
if not exist ".env" (
    if exist ".env.example" (
        copy ".env.example" ".env" >nul
        echo ✅ Created .env from .env.example
        echo ⚠️  Please update .env with your database credentials and JWT secrets
        echo 💡 Generate secure JWT secrets with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
    ) else (
        echo ❌ .env.example not found. Please create it first.
        pause
        exit /b 1
    )
) else (
    echo ✅ .env file already exists
)

REM Install dependencies
echo 📦 Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)
echo ✅ Dependencies installed

REM Setup database (if PostgreSQL is available)
if "%HAS_POSTGRES%"=="true" (
    echo 🗄️  Setting up database...
    
    REM Check if we can connect to the database
    call npm run db:deploy >nul 2>&1
    if !errorlevel! equ 0 (
        echo ✅ Database migrations applied
        
        REM Run smart seeding
        call npm run db:seed:check
        echo ✅ Database setup completed
    ) else (
        echo ⚠️  Could not connect to database. Please check your DATABASE_URL in .env
        echo 💡 Make sure your PostgreSQL server is running and the database exists
    )
) else (
    echo ⚠️  Skipping database setup - PostgreSQL not available
)

REM Generate Prisma client
echo 🔧 Generating Prisma client...
call npm run db:generate
if %errorlevel% neq 0 (
    echo ❌ Failed to generate Prisma client
    pause
    exit /b 1
)
echo ✅ Prisma client generated

echo.
echo 🎉 Local development setup complete!
echo =======================================
echo.
echo 📋 Next steps:
echo   1. Update .env with your database credentials and secure JWT secrets
echo   2. If you haven't set up PostgreSQL locally, you can:
echo      - Install PostgreSQL locally, or
echo      - Use Docker for database only (see command above)
echo   3. Run the development server: npm run dev
echo   4. Open http://localhost:3000/api/docs for API documentation
echo.
echo 💡 Useful commands:
echo   npm run dev          - Start development server
echo   npm run db:studio    - Open Prisma Studio (database GUI)
echo   npm run db:reset     - Reset database (warning: deletes all data)
echo   npm run lint         - Run ESLint
echo   npm run type-check   - Check TypeScript types

endlocal
pause