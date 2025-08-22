-- Database Initialization Script for Docker Development
-- This script ensures the database and user are properly configured
-- It runs when PostgreSQL container starts for the first time

-- Create user if it doesn't exist
DO
$do$
BEGIN
   IF NOT EXISTS (
      SELECT FROM pg_catalog.pg_roles
      WHERE rolname = 'dev_user') THEN
      CREATE USER dev_user WITH PASSWORD 'dev_password';
   END IF;
END
$do$;

-- Grant necessary permissions to the user
ALTER USER dev_user CREATEDB;

-- Grant privileges on the database
-- The database is created by POSTGRES_DB env var, so it should exist
GRANT ALL PRIVILEGES ON DATABASE keven_dev_db TO dev_user;

-- Set database configuration for optimal performance
ALTER DATABASE keven_dev_db SET timezone TO 'UTC';

-- Enable useful extensions (optional)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Grant schema permissions
GRANT ALL ON SCHEMA public TO dev_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO dev_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO dev_user;

-- Note: Table creation and seeding is handled by:
-- 1. Prisma migrations (npm run db:deploy)
-- 2. Smart seeding script (npm run db:seed:check)