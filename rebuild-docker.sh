#!/bin/bash

# Stop existing containers
echo "Stopping and removing existing containers..."
docker-compose -f docker-compose.complete.yml down

# Remove old volumes to ensure clean state
echo "Removing old volumes..."
docker volume rm bpl1_postgres_data bpl1_redis_data bpl1_backend_node_modules bpl1_frontend_node_modules 2>/dev/null || true

# Rebuild images
echo "Rebuilding Docker images..."
docker-compose -f docker-compose.complete.yml build --no-cache

# Start services
echo "Starting services..."
docker-compose -f docker-compose.complete.yml up -d

# Show container status
echo "Container status:"
docker ps

echo "==================================="
echo "Service endpoints:"
echo "Frontend: http://localhost:5173"
echo "Backend API: http://localhost:4000"
echo "Database Admin (Adminer): http://localhost:8080"
echo ""
echo "Adminer login credentials:"
echo "System: PostgreSQL"
echo "Server: postgres"
echo "Username: lavkushkumar"
echo "Password: postgres"
echo "Database: eventia"
echo "==================================="

echo "To view logs: docker-compose -f docker-compose.complete.yml logs -f" 