-- Development Database Initialization Script
-- This script sets up the development database with proper extensions and settings

-- Create extensions if they don't exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "citext";

-- Set timezone to UTC
SET timezone = 'UTC';

-- Create development-specific configurations
ALTER DATABASE keven_dev_db SET timezone TO 'UTC';

-- Log the successful initialization
SELECT 'Development database initialized successfully with UUID and CITEXT extensions' as status;