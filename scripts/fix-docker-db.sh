#!/bin/bash

# Fix Docker Database Connection Issues
# This script helps recover from database user/permission issues

echo "🔧 Fixing Docker Database Connection..."
echo "======================================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop first."
    exit 1
fi

# Option 1: Try to fix the existing database
echo "Attempting to fix existing database..."
docker exec -i keven-postgres psql -U postgres << EOF
-- Create user if missing
DO
\$do\$
BEGIN
   IF NOT EXISTS (
      SELECT FROM pg_catalog.pg_roles
      WHERE rolname = 'dev_user') THEN
      CREATE USER dev_user WITH PASSWORD 'dev_password';
   END IF;
END
\$do\$;

-- Grant permissions
ALTER USER dev_user CREATEDB;
GRANT ALL PRIVILEGES ON DATABASE keven_dev_db TO dev_user;
GRANT ALL ON SCHEMA public TO dev_user;
EOF

if [ $? -eq 0 ]; then
    echo "✅ Database user fixed successfully!"
    echo "🔄 Restarting backend container..."
    docker restart keven-backend
    echo "✅ Done! The backend should now connect successfully."
else
    echo "⚠️  Could not fix the database automatically."
    echo ""
    echo "🔄 Performing clean restart..."
    docker-compose down -v
    echo "✅ Old volumes removed. Run 'npm run docker:dev' to start fresh."
fi