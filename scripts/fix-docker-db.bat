@echo off
REM Fix Docker Database Connection Issues (Windows)
REM This script helps recover from database user/permission issues

echo 🔧 Fixing Docker Database Connection...
echo =======================================

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not running. Please start Docker Desktop first.
    pause
    exit /b 1
)

REM Try to fix the existing database
echo Attempting to fix existing database...

REM Create a temporary SQL file
echo -- Create user if missing > temp_fix.sql
echo DO $$  >> temp_fix.sql
echo BEGIN >> temp_fix.sql
echo    IF NOT EXISTS ( >> temp_fix.sql
echo       SELECT FROM pg_catalog.pg_roles >> temp_fix.sql
echo       WHERE rolname = 'dev_user') THEN >> temp_fix.sql
echo       CREATE USER dev_user WITH PASSWORD 'dev_password'; >> temp_fix.sql
echo    END IF; >> temp_fix.sql
echo END >> temp_fix.sql
echo $$; >> temp_fix.sql
echo ALTER USER dev_user CREATEDB; >> temp_fix.sql
echo GRANT ALL PRIVILEGES ON DATABASE keven_dev_db TO dev_user; >> temp_fix.sql
echo GRANT ALL ON SCHEMA public TO dev_user; >> temp_fix.sql

REM Execute the SQL
docker exec -i keven-postgres psql -U postgres < temp_fix.sql >nul 2>&1

if %errorlevel% equ 0 (
    del temp_fix.sql
    echo ✅ Database user fixed successfully!
    echo 🔄 Restarting backend container...
    docker restart keven-backend
    echo ✅ Done! The backend should now connect successfully.
) else (
    del temp_fix.sql
    echo ⚠️  Could not fix the database automatically.
    echo.
    echo 🔄 Performing clean restart...
    docker-compose down -v
    echo ✅ Old volumes removed. Run 'npm run docker:dev' to start fresh.
)

pause