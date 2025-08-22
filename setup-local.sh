#!/bin/bash

# Keven Backend Template - Local Development Setup Script
# This script sets up the local development environment

set -e

echo "🚀 Setting up Keven Backend Template for Local Development"
echo "========================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
print_status "Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node --version | sed 's/v//')
REQUIRED_VERSION="18.0.0"

if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
    print_error "Node.js version $NODE_VERSION is too old. Please install Node.js 18 or higher."
    exit 1
fi

print_success "Node.js $NODE_VERSION is installed"

# Check if PostgreSQL is installed (optional)
print_status "Checking PostgreSQL installation..."
if command -v psql &> /dev/null; then
    PG_VERSION=$(psql --version | head -n1 | awk '{print $3}')
    print_success "PostgreSQL $PG_VERSION is installed"
    HAS_POSTGRES=true
else
    print_warning "PostgreSQL is not installed locally"
    print_status "You can either:"
    print_status "  1. Install PostgreSQL locally"
    print_status "  2. Use Docker for just the database: docker run -d --name postgres-dev -e POSTGRES_USER=keven_user -e POSTGRES_PASSWORD=your_password -e POSTGRES_DB=keven_dev_db -p 5432:5432 postgres:15-alpine"
    print_status "  3. Use the full Docker development setup: npm run docker:dev"
    HAS_POSTGRES=false
fi

# Create environment file
print_status "Setting up environment file..."
if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        cp .env.example .env
        print_success "Created .env from .env.example"
        print_warning "Please update .env with your database credentials and JWT secrets"
        print_status "Generate secure JWT secrets with: node -e \"console.log(require('crypto').randomBytes(64).toString('hex'))\""
    else
        print_error ".env.example not found. Please create it first."
        exit 1
    fi
else
    print_success ".env file already exists"
fi

# Install dependencies
print_status "Installing dependencies..."
npm install
print_success "Dependencies installed"

# Setup database (if PostgreSQL is available)
if [ "$HAS_POSTGRES" = true ]; then
    print_status "Setting up database..."
    
    # Check if we can connect to the database
    if npm run db:deploy &> /dev/null; then
        print_success "Database migrations applied"
        
        # Run smart seeding
        npm run db:seed:check
        print_success "Database setup completed"
    else
        print_warning "Could not connect to database. Please check your DATABASE_URL in .env"
        print_status "Make sure your PostgreSQL server is running and the database exists"
    fi
else
    print_warning "Skipping database setup - PostgreSQL not available"
fi

# Generate Prisma client
print_status "Generating Prisma client..."
npm run db:generate
print_success "Prisma client generated"

echo ""
print_success "Local development setup complete!"
echo "======================================="
echo ""
print_status "Next steps:"
echo "  1. Update .env with your database credentials and secure JWT secrets"
echo "  2. If you haven't set up PostgreSQL locally, you can:"
echo "     - Install PostgreSQL locally, or"
echo "     - Use Docker for database only: docker run -d --name postgres-dev -e POSTGRES_USER=keven_user -e POSTGRES_PASSWORD=your_password -e POSTGRES_DB=keven_dev_db -p 5432:5432 postgres:15-alpine"
echo "  3. Run the development server: npm run dev"
echo "  4. Open http://localhost:3000/api/docs for API documentation"
echo ""
print_status "Useful commands:"
echo "  npm run dev          - Start development server"
echo "  npm run db:studio    - Open Prisma Studio (database GUI)"
echo "  npm run db:reset     - Reset database (warning: deletes all data)"
echo "  npm run lint         - Run ESLint"
echo "  npm run type-check   - Check TypeScript types"