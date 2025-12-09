# Eventia Platform Troubleshooting Guide

This document addresses common errors and issues you might encounter when setting up and running the Eventia platform.

## TypeScript Errors

### Rate Limiting Error

If you encounter this error in the backend:

```
TSError: ⨯ Unable to compile TypeScript:
src/middleware/rateLimit.ts(65,3): error TS2322: Type '(req: Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>) => string | undefined' is not assignable to type 'ValueDeterminingMiddleware<string>'.
```

**Fix**: Modify the `keyGenerator` function in `src/middleware/rateLimit.ts` to ensure it never returns `undefined`:

```typescript
keyGenerator: (req: Request) => {
  // Get the user's IP address or API key
  const apiKey = req.get('X-API-Key');
  if (apiKey) {
    return apiKey;
  }
  
  // If no API key, use the IP address or a default value
  return req.ip || 'unknown-ip';
}
```

## Frontend Import Errors

### Missing `API_BASE_URL` Export

If you see this error:

```
✘ [ERROR] No matching export in "src/config/index.ts" for import "API_BASE_URL"
```

**Fix**: Add the `API_BASE_URL` export to `src/config/index.ts`:

```typescript
// Add to src/config/index.ts
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';
```

### Missing `defaultApiClient` Export

If you see this error:

```
✘ [ERROR] No matching export in "src/services/api/index.ts" for import "defaultApiClient"
```

**Fix**: Create a proper API client implementation in `src/services/api/index.ts`:

```typescript
// Replace or update src/services/api/index.ts
import axios from 'axios';
import { API_BASE_URL } from '../../config';

// Create and export the default API client
export const defaultApiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for authentication
defaultApiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// API service methods
const api = {
  // Auth endpoints
  login: (email: string, password: string) => 
    defaultApiClient.post('/auth/login', { email, password }),
  
  // Events endpoints
  getEvents: (params?: any) => 
    defaultApiClient.get('/events', { params }),
  
  getEvent: (id: string) => 
    defaultApiClient.get(`/events/${id}`),
  
  // Add other API methods as needed
};

export default api;
```

## Port Configuration Issues

If you notice the backend is running on a different port than expected, make sure the port is consistent across all configuration files:

1. In `.env` files, ensure `PORT=4000` for the backend
2. In frontend `.env` files, ensure `VITE_API_URL=http://localhost:4000/api/v1`
3. In scripts, update any references to backend port to be `4000`

## PostgreSQL Issues

If you see warnings about PostgreSQL not being installed:

1. For local development, install PostgreSQL:
   ```bash
   # macOS
   brew install postgresql
   
   # Ubuntu/Debian
   sudo apt install postgresql
   ```

2. Create the database and user for Eventia:
   ```bash
   sudo -u postgres psql
   CREATE DATABASE eventia;
   CREATE USER eventia WITH ENCRYPTED PASSWORD 'securepass';
   GRANT ALL PRIVILEGES ON DATABASE eventia TO eventia;
   \q
   ```

3. Update `.env` file with the correct database connection string:
   ```
   DATABASE_URL="postgresql://eventia:securepass@localhost:5432/eventia"
   ```

## Multiple Default Exports

If you see errors like:

```
A module cannot have multiple default exports
```

Make sure each file has only one `export default` statement. Review the files mentioned in the error messages and remove or rename duplicate default exports.

## Missing Module Errors

For errors like:

```
Cannot find module './types' or its corresponding type declarations
```

Either create the missing files or remove the imports. For example:

1. Create `src/services/api/types.ts`:
   ```typescript
   // Basic API types
   export interface ApiResponse<T> {
     data: T;
     success: boolean;
     message?: string;
   }
   ```

2. Or remove the import if it's not needed:
   ```typescript
   // Remove or comment out
   // export * from './types';
   ```

## General Troubleshooting

1. **Clean Node Modules**: Sometimes a clean install can fix dependency issues:
   ```bash
   rm -rf node_modules
   npm cache clean --force
   npm install
   ```

2. **Check TypeScript Version**: Make sure TypeScript versions are compatible:
   ```bash
   npm list typescript
   ```

3. **Check for Conflicting Dependencies**: Look for peer dependency warnings:
   ```bash
   npm ls
   ```

4. **Update npm packages**: Try updating npm packages to fix compatibility issues:
   ```bash
   npm update
   ```

For additional help, refer to project documentation or open an issue on the project repository. 