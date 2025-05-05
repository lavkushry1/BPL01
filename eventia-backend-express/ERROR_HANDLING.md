# Error Handling System

This document outlines the comprehensive error handling system implemented across both frontend and backend of the Eventia application.

## Backend Error Handling

### 1. Standardized Error Codes

All error codes are now centralized in `src/utils/errorCodes.ts`, categorized by:
- Authentication errors
- Resource errors
- Validation errors
- Business logic errors
- System errors

This ensures consistent error codes across the application and makes client-side error handling more predictable.

### 2. ApiError Class

The `ApiError` class has been enhanced to use standardized error codes and provides utility methods for common error types:
- `ApiError.badRequest()` - 400 errors
- `ApiError.unauthorized()` - 401 errors
- `ApiError.forbidden()` - 403 errors
- `ApiError.notFound()` - 404 errors
- `ApiError.conflict()` - 409 errors
- `ApiError.validationError()` - 422 errors
- `ApiError.internal()` - 500 errors

### 3. Global Error Handler Middleware

The `errorHandler` middleware in `src/middleware/errorHandler.ts` now:
- Handles ApiError instances with proper status codes
- Provides special handling for Prisma errors (unique constraints, not found, etc.)
- Handles Zod validation errors
- Handles JWT authentication errors
- Ensures standardized error response format
- Logs errors with appropriate context

### 4. Controller Error Handling

Controllers have been updated to use:
- The standardized error codes
- Proper error types with descriptive messages
- Consistent response formats

## Frontend Error Handling

### 1. API Client

The API client (`src/services/api/apiClient.ts`) now:
- Has standardized error response formats
- Includes interceptors for handling common error cases
- Handles authentication errors with token refresh
- Logs errors with context
- Provides typed helper methods for API operations

### 2. Error Components

We've added reusable error components:
- `FormError` - For displaying validation errors in forms
- `FieldError` - For displaying individual field errors
- `ErrorState` - For displaying error states in the UI
- `LoadingError` - For displaying data loading errors
- `SubmissionError` - For displaying form submission errors

### 3. Error Handling Hooks

Custom hooks for error handling:
- `handleQueryError` - For handling errors in React Query data fetching
- `handleMutationError` - For handling errors in mutation operations

## Usage Examples

### Backend

```typescript
// Controller with error handling
static createUser = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { email, password, name } = req.body;
  
  // Check if email already exists
  const existingUser = await prisma.user.findUnique({ where: { email } });
  
  if (existingUser) {
    throw new ApiError(409, 'Email already in use', ErrorCode.EMAIL_ALREADY_EXISTS);
  }
  
  // Create user
  const user = await prisma.user.create({
    data: { 
      email, 
      password: await hashPassword(password),
      name 
    }
  });
  
  return ApiResponse.created(res, { id: user.id, email: user.email }, 'User created successfully');
});
```

### Frontend

```tsx
// React component with error handling
const UserProfile = () => {
  const { data, error, isLoading } = useQuery(['user', 'profile'], getUserProfile, {
    onError: (err) => handleQueryError(err, { context: 'user-profile' })
  });
  
  if (isLoading) return <LoadingSkeleton />;
  if (error) return <LoadingError error={error} retry={() => refetch()} />;
  
  return (
    <div>
      <h1>{data.name}</h1>
      <p>{data.email}</p>
    </div>
  );
};
```

## Benefits

1. **Consistency** - Standardized error handling across the application
2. **Developer Experience** - Clear error messages with context for debugging
3. **User Experience** - User-friendly error messages and recovery options
4. **Maintainability** - Centralized error codes and handling patterns
5. **Security** - Proper handling of sensitive errors

## Future Improvements

1. Add more contextual error logging for production debugging
2. Implement automatic retry mechanisms for transient errors
3. Add support for internationalization of error messages
4. Create error monitoring dashboards for tracking error trends 