#!/bin/bash

# SAFE Docker Cleanup Script
# This script ONLY removes resources from this specific project

PROJECT_NAME="keven-backend-template"

echo "🧹 Safe Cleanup for $PROJECT_NAME"
echo "=================================="
echo "This will ONLY remove resources from this project."
echo ""

# Show what will be removed
echo "📋 The following resources will be removed:"
echo "  - Containers: $(docker ps -a -q -f name=$PROJECT_NAME 2>/dev/null | wc -l) containers"
echo "  - Volumes: $(docker volume ls -q -f name=$PROJECT_NAME 2>/dev/null | wc -l) volumes"
echo "  - Networks: $(docker network ls -q -f name=$PROJECT_NAME 2>/dev/null | wc -l) networks"
echo ""

read -p "❓ Are you sure you want to remove these resources? (y/N): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🔄 Stopping and removing project containers..."
    docker compose down -v
    
    echo "🔄 Removing project volumes..."
    docker volume ls -q -f name=$PROJECT_NAME | xargs -r docker volume rm 2>/dev/null || true
    
    echo "✅ Cleanup complete. Only $PROJECT_NAME resources were removed."
else
    echo "❌ Cleanup cancelled."
fi