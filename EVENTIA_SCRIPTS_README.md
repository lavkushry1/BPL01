# Eventia Platform Scripts

This folder contains a set of scripts to simplify the setup, development, building, and deployment of the Eventia ticketing platform, which consists of a React frontend (`eventia-ticketing-flow1`) and an Express backend (`eventia-backend-express`).

## Prerequisites

- Node.js v16 or higher
- npm v7 or higher
- PostgreSQL (for development with real database)

## Available Scripts

### 1. `setup-env.sh`

This script sets up the development environment for both the frontend and backend projects.

**Features:**
- Checks for Node.js v16+ and installs if missing
- Creates proper `.env` files for both projects
- Sets up the database connection string for Prisma
- Installs all npm dependencies
- Runs Prisma migrations to set up the database schema
- Provides clear console feedback

**Usage:**
```bash
./setup-env.sh
```

### 2. `run-dev.sh`

This script starts both the frontend and backend in development mode with live reloading.

**Features:**
- Starts the backend Express server
- Starts the frontend Vite dev server
- Opens the application in the default browser
- Displays color-coded logs from both servers in a single terminal
- Includes a CTRL+C handler to properly shut down both servers

**Usage:**
```bash
./run-dev.sh
```

### 3. `build-prod.sh`

This script creates optimized production builds for both the frontend and backend.

**Features:**
- Creates optimized builds with NODE_ENV=production
- Sets up proper environment variables for production
- Runs Prisma migrations for production database
- Verifies that builds are complete and valid
- Generates a unique release ID for the build

**Usage:**
```bash
./build-prod.sh
```

### 4. `run-prod.sh`

This script runs the application in production mode using the optimized builds.

**Features:**
- Starts the backend in production mode
- Serves the frontend build using a static server
- Sets up proper production environment variables
- Implements error handling and restart capabilities
- Monitors services and automatically restarts them if they crash

**Usage:**
```bash
./run-prod.sh
```

## Workflow Example

A typical workflow would be:

1. Set up the environment:
   ```bash
   ./setup-env.sh
   ```

2. Start development servers:
   ```bash
   ./run-dev.sh
   ```

3. When ready to deploy, build for production:
   ```bash
   ./build-prod.sh
   ```

4. Run the production build:
   ```bash
   ./run-prod.sh
   ```

## Troubleshooting

### Common Issues

1. **Scripts not executable**:
   ```bash
   chmod +x setup-env.sh run-dev.sh build-prod.sh run-prod.sh
   ```

2. **PostgreSQL not running**:
   Make sure PostgreSQL is installed and running. The connection string can be configured in the `.env` file.

3. **Port conflicts**:
   If you have services already running on ports 5001 (backend) or 8080/3000 (frontend), you might need to modify the port configurations in the respective `.env` files.

4. **Build failures**:
   If builds fail, check the error messages and make sure all dependencies are properly installed and there are no TypeScript or linting errors.

## Directory Structure

```
/Users/lavkushkumar/Desktop/BPL1/
├── eventia-backend-express/   # Backend Express application
├── eventia-ticketing-flow1/   # Frontend React application
├── setup-env.sh               # Environment setup script
├── run-dev.sh                 # Development launcher
├── build-prod.sh              # Production build script
└── run-prod.sh                # Production run script
```

## Customization

You can modify these scripts to suit your specific needs:

- To change ports, modify the relevant `.env` files
- To add custom environment variables, edit the `.env` sections in `setup-env.sh`
- To adjust build settings, modify the build commands in `build-prod.sh`

## Notes for Production Deployment

For a real production deployment, consider:

1. Setting up a reverse proxy (like Nginx)
2. Configuring HTTPS with proper SSL certificates
3. Setting up a process manager like PM2 for the Node.js backend
4. Using Docker containers for better isolation and easier deployment

These scripts provide a good starting point but may need additional configuration for enterprise-level deployments. 