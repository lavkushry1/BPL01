# Docker Setup for Eventia Backend

This guide explains how to run PostgreSQL and Redis services using Docker for the Eventia backend application.

## Files Overview

- `Dockerfile.postgres`: Custom PostgreSQL image with initialization scripts
- `init-postgres.sh`: PostgreSQL initialization script that creates extensions and sets permissions
- `docker-compose.postgres.yml`: Docker Compose file to start both PostgreSQL and Redis services

## Getting Started

### Prerequisites

- Docker
- Docker Compose

### Running the Services

1. Run PostgreSQL and Redis with Docker Compose:

```bash
docker-compose -f docker-compose.postgres.yml up -d
```

2. Verify the services are running:

```bash
docker ps
```

3. Update your `.env` file to connect to the Docker services:

```
# Database Configuration
DATABASE_URL=postgresql://lavkushkumar:postgres@localhost:5432/eventia
DB_HOST=localhost
DB_PORT=5432
DB_USER=lavkushkumar
DB_PASSWORD=postgres
DB_NAME=eventia
DB_SSL=false

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
```

## Managing the Services

- Stop services:
  ```bash
  docker-compose -f docker-compose.postgres.yml down
  ```

- View logs:
  ```bash
  # PostgreSQL logs
  docker logs eventia_postgres
  
  # Redis logs
  docker logs eventia_redis
  ```

- Access PostgreSQL shell:
  ```bash
  docker exec -it eventia_postgres psql -U lavkushkumar -d eventia
  ```

- Access Redis shell:
  ```bash
  docker exec -it eventia_redis redis-cli
  ```

## Data Persistence

The services use Docker volumes for data persistence:
- `postgres_data`: Stores PostgreSQL data
- `redis_data`: Stores Redis data

Even if you restart or recreate the containers, your data will be preserved.

## Troubleshooting

If you encounter connection issues:

1. Make sure the containers are running:
   ```bash
   docker ps
   ```

2. Check container logs for errors:
   ```bash
   docker logs eventia_postgres
   docker logs eventia_redis
   ```

3. Verify you can connect to PostgreSQL:
   ```bash
   docker exec -it eventia_postgres psql -U lavkushkumar -d eventia -c "SELECT 1"
   ```

4. Verify you can connect to Redis:
   ```bash
   docker exec -it eventia_redis redis-cli ping
   ``` 