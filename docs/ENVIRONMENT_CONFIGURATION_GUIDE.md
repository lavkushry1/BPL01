# Environment Configuration Guide

This guide explains the environment configuration structure and best practices for the Eventia ticketing application. Following these guidelines will ensure secure and consistent configuration across different environments.

## Overview

The Eventia application consists of two main components:
- **Backend API** (Express/TypeScript/Prisma)
- **Frontend UI** (React/TypeScript/Vite)

Each component has its own environment configuration that must be properly configured for development, testing, and production environments.

## Directory Structure

```
/eventia-backend-express/
  .env.example          # Template with placeholder values
  .env.development      # Development environment config
  .env.test             # Test environment config
  .env.production       # Production environment config (with placeholders)
  .env                  # Local override (not committed to git)

/eventia-ticketing-flow1/
  .env.example          # Template with placeholder values
  .env.development      # Development environment config
  .env.production       # Production environment config (with placeholders)
  .env                  # Local override (not committed to git)
```

## Backend Configuration

### File Purpose

- **`.env.example`**: Template showing all required variables with placeholder values. Used for documentation.
- **`.env.development`**: Default configuration for local development environments.
- **`.env.test`**: Configuration for automated testing environments.
- **`.env.production`**: Template for production with placeholders that will be replaced during deployment.
- **`.env`**: Local override for development (never committed to git).

### Security Guidelines

1. **Never commit real secrets to Git**
   - Use placeholders in all committed .env files
   - Store real secrets in a secure vault or CI/CD system

2. **Use strong JWT secrets**
   - At least 32 characters long
   - Unique per environment
   - Randomly generated

3. **Database security**
   - Use different databases for dev/test/prod
   - Create application-specific database users
   - Enable SSL for production database connections

4. **Validation**
   - The application validates required variables on startup
   - In production, missing critical variables will prevent startup

## Frontend Configuration

### File Purpose

- **`.env.example`**: Template showing all available variables
- **`.env.development`**: Default for local development
- **`.env.production`**: Template for production builds
- **`.env`**: Local override (not committed to git)

### Security Guidelines

1. **API URLs**
   - Use relative URLs in production to avoid CORS issues
   - Use explicit URLs for development

2. **Environment-specific feature flags**
   - Disable debug tools in production
   - Never enable mock data in production

3. **Client-side security**
   - Never store API secrets in frontend code
   - Only use public API keys in frontend code
   - Use shorter JWT expiry times in production

## Configuration Loading

### Backend

The backend application loads configuration based on the `NODE_ENV` environment variable:

```typescript
const envFile = envFiles[process.env.NODE_ENV as keyof typeof envFiles] || '.env';
```

Configuration values are strongly typed, validated, and sensitive values are redacted in logs:

```typescript
// Validate required variables
if (config.isProduction) {
  const missingVars = requiredVars.filter(v => !v.key);
  
  if (missingVars.length > 0) {
    const errorMsg = `Missing required environment variables: ${missingVars.map(v => v.path).join(', ')}`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }
}
```

### Frontend

The frontend application uses Vite's environment loading mechanism, which loads variables based on the build mode:

- `development`: `.env.development` + `.env`
- `production`: `.env.production` + `.env`

Configuration is accessed via `import.meta.env` and centralized in a type-safe config object:

```typescript
const config = mergeConfig(defaultConfig, environmentConfig[currentEnv]);
export const { api, auth, features } = config;
```

## CI/CD Integration

### For Backend

```yaml
# Example GitHub Actions workflow for backend deployment
jobs:
  deploy-production:
    environment: production
    steps:
      - uses: actions/checkout@v3
      - name: Set production secrets
        run: |
          # Create .env file from production template
          cp .env.production .env
          
          # Replace placeholders with actual secrets
          sed -i "s|\${JWT_SECRET}|${{ secrets.JWT_SECRET }}|g" .env
          sed -i "s|\${DB_PASSWORD}|${{ secrets.DB_PASSWORD }}|g" .env
          # ... replace other variables
```

### For Frontend

```yaml
# Example GitHub Actions workflow for frontend deployment
jobs:
  build-frontend:
    environment: production
    steps:
      - uses: actions/checkout@v3
      - name: Build with environment variables
        env:
          VITE_API_URL: ${{ secrets.API_URL }}
          VITE_ANALYTICS_ID: ${{ secrets.ANALYTICS_ID }}
        run: npm run build
```

## Best Practices Summary

1. **Environment Separation**
   - Use separate .env files for development, test, and production
   - Use different database instances for each environment

2. **Secret Management**
   - Never commit real secrets to Git
   - Use CI/CD systems to inject secrets during deployment
   - Rotate secrets regularly

3. **Configuration Validation**
   - Validate required variables on application startup
   - Fail fast if critical variables are missing in production

4. **Type Safety**
   - Use TypeScript interfaces to ensure configuration type safety
   - Document the purpose and format of each variable

5. **Default Values**
   - Provide sensible defaults for non-critical variables
   - Document required variables that have no defaults

6. **Security Hygiene**
   - Use longer, more complex secrets in production
   - Enable SSL for all database connections in production
   - Use shorter JWT expiry times in production

## Troubleshooting

- **Missing variable errors**: Check that all required variables are defined in your .env file
- **TypeScript errors**: Ensure your configuration object matches the defined interface
- **JWT issues**: Verify secret length and expiry time format
- **Database connection issues**: Check credentials and SSL settings 