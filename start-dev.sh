#!/bin/bash

echo "========================================"
echo "  Keven Backend Template - Development"
echo "========================================"
echo

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}ERROR: Docker is not installed${NC}"
    echo "Please install Docker from https://www.docker.com/products/docker-desktop"
    exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo -e "${RED}ERROR: Docker daemon is not running${NC}"
    echo "Please start Docker and try again"
    exit 1
fi

# Check if .env file exists, if not copy from .env.example
if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        echo -e "${YELLOW}Creating .env file from .env.example...${NC}"
        cp .env.example .env
        echo
        echo -e "${YELLOW}IMPORTANT: Please edit .env file with your configuration${NC}"
        echo "Press Enter to continue after editing .env file..."
        read -r
    else
        echo -e "${RED}ERROR: .env.example file not found${NC}"
        echo "Please create .env.example file first"
        exit 1
    fi
fi

echo -e "${GREEN}Starting development environment...${NC}"
echo
echo "This will:"
echo "- Start PostgreSQL database (data persists between restarts)"
echo "- Start backend API with hot reload"
echo "- Available at http://localhost:3000"
echo "- Swagger docs at http://localhost:3000/api/docs"
echo

# Start Docker Compose with development configuration
docker-compose -f docker-compose.dev.yml up --build

echo
echo "Development environment stopped."