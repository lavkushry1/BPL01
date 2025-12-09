# Running the Complete Eventia Project with Docker

This guide explains how to run the entire Eventia project (including database, Redis, backend, and frontend) using Docker.

## Files Overview

- `docker-compose.complete.yml`: Main Docker Compose file to run all services
- `Dockerfile.postgres`: Custom PostgreSQL image with initialization scripts
- `init-postgres.sh`: PostgreSQL initialization script
- `eventia-backend-express/Dockerfile.dev`: Backend Node.js application Dockerfile
- `eventia-ticketing-flow1/Dockerfile.dev`: Frontend React/Vite application Dockerfile

## Getting Started

### Prerequisites

- Docker
- Docker Compose

### Running the Complete Stack

1. Start all services (database, Redis, backend, and frontend):

```bash
docker-compose -f docker-compose.complete.yml up -d
```

2. Verify all services are running:

```bash
docker ps
```

3. Access the application:

   - Frontend: http://localhost:5173
   - Backend API: http://localhost:4000
   - Database Admin UI (Adminer): http://localhost:8080
     - System: PostgreSQL
     - Server: postgres
     - Username: lavkushkumar
     - Password: postgres
     - Database: eventia

## Managing the Services

### Stop all services:
```bash
docker-compose -f docker-compose.complete.yml down
```

### View logs from a specific service:
```bash
# Backend logs
docker logs -f eventia_backend

# Frontend logs
docker logs -f eventia_frontend

# Database logs
docker logs -f eventia_postgres

# Redis logs
docker logs -f eventia_redis
```

### Restart a specific service:
```bash
docker-compose -f docker-compose.complete.yml restart backend
```

### View all running services:
```bash
docker-compose -f docker-compose.complete.yml ps
```

## Data Persistence

The services use Docker volumes for data persistence:
- `postgres_data`: Stores PostgreSQL data
- `redis_data`: Stores Redis data

Even if you restart or stop and start the containers, your data will be preserved.

## Service Endpoints

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:4000
- **Adminer Database Admin**: http://localhost:8080
- **PostgreSQL (direct access)**: localhost:5432
- **Redis (direct access)**: localhost:6379

## Troubleshooting

### Database Connection Issues:

1. Check if PostgreSQL is running:
   ```bash
   docker logs -f eventia_postgres
   ```

2. Connect to the database directly:
   ```bash
   docker exec -it eventia_postgres psql -U lavkushkumar -d eventia
   ```

### Backend Services Issues:

1. View Backend Logs:
   ```bash
   docker logs -f eventia_backend
   ```

2. Connect to backend container:
   ```bash
   docker exec -it eventia_backend sh
   ```

### Frontend Services Issues:

1. View Frontend Logs:
   ```bash
   docker logs -f eventia_frontend
   ```

2. Connect to frontend container:
   ```bash
   docker exec -it eventia_frontend sh
   ```

### Redis Issues:

1. Check Redis logs:
   ```bash
   docker logs -f eventia_redis
   ```

2. Connect to Redis CLI:
   ```bash
   docker exec -it eventia_redis redis-cli
   ```

## Development Workflow

With Docker volumes mounted, you can edit code directly in your local directory and see changes reflected immediately:

1. Frontend code changes will automatically reload in the browser
2. Backend code changes will automatically reload through nodemon

If you add new dependencies, you might need to rebuild the container:
```bash
docker-compose -f docker-compose.complete.yml up -d --build frontend
# or
docker-compose -f docker-compose.complete.yml up -d --build backend
``` 