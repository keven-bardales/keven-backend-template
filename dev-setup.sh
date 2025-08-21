#!/bin/bash

# Keven Backend Template - Development Setup Script
# This script sets up the development environment with Docker

set -e

echo "🚀 Setting up Keven Backend Template Development Environment..."
echo "================================================"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ Docker and Docker Compose are installed"

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p logs
mkdir -p database
mkdir -p .env.dev

# Check if .env.dev exists, create if not
if [ ! -f ".env.dev" ]; then
    echo "📝 Creating .env.dev file..."
    cat > .env.dev << EOF
# Development Environment Variables
NODE_ENV=development
PORT=3000

# Database Configuration
DATABASE_URL=postgresql://dev_user:dev_password@postgres-dev:5432/keven_dev_db
POSTGRES_USER=dev_user
POSTGRES_PASSWORD=dev_password
POSTGRES_DB=keven_dev_db

# JWT Configuration (Development keys - DO NOT use in production)
JWT_ACCESS_SECRET=dev-super-secret-access-key-at-least-32-chars-long-for-security-purposes
JWT_REFRESH_SECRET=dev-super-secret-refresh-key-at-least-32-chars-long-for-security-purposes
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Bcrypt Configuration
BCRYPT_SALT_ROUNDS=10

# Super Admin Configuration
SUPER_ADMIN_EMAIL=admin@dev.local

# CORS Configuration
CORS_ORIGINS=http://localhost:3001,http://localhost:4200,http://localhost:5173,http://127.0.0.1:3001,http://127.0.0.1:4200
CORS_CREDENTIALS=true

# Logging Configuration
LOG_LEVEL=debug

# API Configuration
SWAGGER_ENABLED=true
API_VERSION=v1

# Development Tools
HOT_RELOAD=true
EOF
    echo "✅ .env.dev file created"
else
    echo "✅ .env.dev file already exists"
fi

# Function to start development environment
start_dev() {
    echo "🐳 Starting development environment..."
    docker-compose -f docker-compose.dev.yml up --build -d
    
    echo "⏳ Waiting for services to be healthy..."
    sleep 10
    
    # Wait for database to be ready
    echo "🗄️  Waiting for database to be ready..."
    timeout 60 docker-compose -f docker-compose.dev.yml exec postgres-dev sh -c 'until pg_isready -U dev_user -d keven_dev_db; do sleep 1; done'
    
    echo "🔄 Running database migrations..."
    docker-compose -f docker-compose.dev.yml exec backend-dev npm run db:migrate
    
    echo "🌱 Seeding database..."
    docker-compose -f docker-compose.dev.yml exec backend-dev npm run db:seed
    
    echo ""
    echo "🎉 Development environment is ready!"
    echo "================================================"
    echo "🌐 Backend API: http://localhost:3000"
    echo "📚 API Documentation: http://localhost:3000/api/docs"
    echo "💚 Health Check: http://localhost:3000/api/health"
    echo "🗄️  Database (Adminer): http://localhost:8080"
    echo "📊 Redis Commander: http://localhost:8081"
    echo ""
    echo "Database credentials:"
    echo "  Host: localhost:5432"
    echo "  User: dev_user"
    echo "  Password: dev_password"
    echo "  Database: keven_dev_db"
    echo ""
    echo "Redis:"
    echo "  Host: localhost:6379"
    echo ""
    echo "To view logs: docker-compose -f docker-compose.dev.yml logs -f backend-dev"
    echo "To stop: docker-compose -f docker-compose.dev.yml down"
    echo "================================================"
}

# Function to stop development environment
stop_dev() {
    echo "🛑 Stopping development environment..."
    docker-compose -f docker-compose.dev.yml down
    echo "✅ Development environment stopped"
}

# Function to restart development environment
restart_dev() {
    echo "🔄 Restarting development environment..."
    docker-compose -f docker-compose.dev.yml down
    docker-compose -f docker-compose.dev.yml up --build -d
    echo "✅ Development environment restarted"
}

# Function to clean development environment
clean_dev() {
    echo "🧹 Cleaning development environment..."
    docker-compose -f docker-compose.dev.yml down -v
    docker system prune -f
    echo "✅ Development environment cleaned"
}

# Function to show logs
logs_dev() {
    docker-compose -f docker-compose.dev.yml logs -f backend-dev
}

# Main script logic
case "${1:-start}" in
    start)
        start_dev
        ;;
    stop)
        stop_dev
        ;;
    restart)
        restart_dev
        ;;
    clean)
        clean_dev
        ;;
    logs)
        logs_dev
        ;;
    tools)
        echo "🛠️  Starting development tools..."
        docker-compose -f docker-compose.dev.yml --profile tools up -d adminer redis-commander
        echo "🗄️  Adminer: http://localhost:8080"
        echo "📊 Redis Commander: http://localhost:8081"
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|clean|logs|tools}"
        echo ""
        echo "Commands:"
        echo "  start   - Start the development environment (default)"
        echo "  stop    - Stop the development environment"
        echo "  restart - Restart the development environment"
        echo "  clean   - Clean all containers and volumes"
        echo "  logs    - Show backend logs"
        echo "  tools   - Start development tools (Adminer, Redis Commander)"
        exit 1
        ;;
esac