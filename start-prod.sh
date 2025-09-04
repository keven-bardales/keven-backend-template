#!/bin/bash

echo "========================================"
echo "  Keven Backend Template - Production"
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
    echo "Please install Docker from https://www.docker.com/"
    exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo -e "${RED}ERROR: Docker daemon is not running${NC}"
    echo "Please start Docker and try again"
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${RED}ERROR: .env file not found${NC}"
    echo "Please create .env file with production configuration"
    echo "You can use .env.example as a template"
    exit 1
fi

echo -e "${YELLOW}WARNING: This will start the production environment${NC}"
echo "Make sure your .env file contains production settings!"
echo
echo "Press Ctrl+C to cancel or Enter to continue..."
read -r

echo -e "${GREEN}Starting production environment...${NC}"
echo
echo "This will:"
echo "- Start PostgreSQL database"
echo "- Start backend API in production mode"
echo "- Available at http://localhost:3000"
echo

# Start Docker Compose with production configuration in detached mode
docker-compose -f docker-compose.prod.yml up -d --build

echo
echo -e "${GREEN}Production environment started in background.${NC}"
echo
echo "To view logs: docker-compose -f docker-compose.prod.yml logs -f"
echo "To stop: docker-compose -f docker-compose.prod.yml down"
echo