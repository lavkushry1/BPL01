# API Structure and Organization

This document provides an overview of the Eventia backend API structure, conventions, and organization.

## Directory Structure

The API routes are organized as follows:

```
src/
├── routes/
│   ├── index.ts                 # Legacy routes for backward compatibility
│   ├── auth.ts                  # Authentication routes (legacy)
│   ├── user.routes.ts           # User routes (legacy)
│   └── v1/                      # Version 1 API routes
│       ├── index.ts             # Root router for all v1 routes
│       ├── admin/               # Admin-specific routes
│       │   ├── index.ts         # Admin router
│       │   └── upiSettings.routes.ts   # UPI settings admin routes
│       └── public/              # Public (non-authenticated) routes
│           ├── index.ts         # Public router
│           └── upi.routes.ts    # UPI-related public routes
```

## Route Registration Pattern

All routes are registered using a standardized pattern:

1. Routes are grouped by resource type (e.g., users, events, payments)
2. Each resource has its own router file
3. All routes use the `router.METHOD(path, middleware, controller)` pattern
4. The `registerRoutes` utility is used to register multiple routes with a common prefix

Example:
```typescript
import { Router } from 'express';
import { registerRoutes } from '../utils/routeHelper';

const router = Router();

// Register resource routes
registerRoutes(router, {
  'users': userRoutes,
  'events': eventRoutes,
  // ...
});

export default router;
```

## API Versioning

- All new routes should be added under `/src/routes/v1/`
- Legacy routes are maintained for backward compatibility
- The base path for v1 API is `/api/v1`

## Route Naming Conventions

- Router files should use the format `resourceName.routes.ts`
- Routes should follow RESTful conventions:
  - GET `/resources` - List resources
  - POST `/resources` - Create a resource
  - GET `/resources/:id` - Get a specific resource
  - PUT/PATCH `/resources/:id` - Update a resource
  - DELETE `/resources/:id` - Delete a resource

## Middleware and Validation

- Route parameters should be validated using Zod schemas
- Use the `validate` middleware for schema validation
- Authentication middleware should be applied at the router level when possible

Example:
```typescript
router.post(
  '/',
  validate(createResourceSchema),
  ResourceController.create
);
```

## Controller Structure

Controllers follow these conventions:
- One controller per resource type
- Controllers are classes with static methods
- Each method corresponds to a single route handler
- All controller methods are wrapped with `asyncHandler`

Example:
```typescript
export class ResourceController {
  static getAll = asyncHandler(async (req, res) => {
    // Implementation
  });
  
  static getById = asyncHandler(async (req, res) => {
    // Implementation
  });
}
```

## API Response Structure

All API responses follow a standard format using the `ApiResponse` utility:

```json
{
  "success": true,
  "message": "Resource retrieved successfully",
  "data": { /* resource data */ },
  "metadata": { /* additional metadata */ }
}
```

For errors:
```json
{
  "success": false,
  "message": "Error message",
  "errorCode": "ERROR_CODE",
  "errors": [ /* detailed error information */ ]
}
```

## Documentation

- All routes should have Swagger/OpenAPI documentation
- Run `npm run docs` to generate Swagger documentation
- Run `npm run docs:routes` to generate a markdown file listing all routes

## Best Practices

1. **Separation of Concerns**
   - Routes define endpoints and apply middleware
   - Controllers handle business logic
   - Models/repositories handle data access

2. **Error Handling**
   - Use `asyncHandler` to catch async errors
   - Use the `ApiError` class for custom errors
   - Return appropriate HTTP status codes

3. **Security**
   - Authenticate and authorize all non-public routes
   - Validate all input data
   - Use CSRF protection for state-changing operations

4. **Performance**
   - Use caching where appropriate
   - Limit response size using pagination
   - Apply rate limiting to protect against abuse 