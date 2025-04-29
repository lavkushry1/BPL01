# API Services

This directory contains service files that handle API communication between the Eventia frontend application and the Express backend API.

## Architecture

The API services follow a consistent architecture using Axios for HTTP requests:

```
Frontend Component → API Service → Express Backend → Database
```

Each service file provides:
- Data type definitions
- API endpoint methods
- Error handling with fallbacks
- Proper response typing

## Available Services

- **authApi.ts** - Authentication and user management 
- **bookingApi.ts** - Booking creation and management
- **discountApi.ts** - Discount code validation and application
- **eventApi.ts** - Event listing and details
- **paymentApi.ts** - Payment processing and verification
- **seatMapApi.ts** - Stadium seating data
- **ticketApi.ts** - Ticket generation and management
- **userApi.ts** - User profile and settings

## Migration from Supabase (Completed)

These services have completely replaced the direct Supabase integration previously found in `src/eventia-backend/services`. The migration has been completed with the following benefits:

1. Centralized all backend logic in the Express API 
2. Improved security by removing direct database access from the frontend
3. Enabled more sophisticated validation and business logic
4. Provided consistent error handling and response structure

For the full migration documentation, see the `SUPABASE_MIGRATION.md` file in the root directory.

## Response Format

All API responses follow this standard format:

```typescript
{
  status: string;       // 'success' or 'error'
  data?: T;             // Response data (when successful)
  message?: string;     // Error or success message
  errors?: any[];       // Validation errors (when applicable)
}
```

## Adding New Services

When creating a new service:

1. Follow the established patterns in existing services
2. Use proper TypeScript interfaces for requests and responses
3. Implement error handling with fallbacks for network issues
4. Document methods with JSDoc comments
5. Export both named exports and a default export 