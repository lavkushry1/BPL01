# API Migration Guide: From Supabase to Express Backend

## Overview

This guide outlines the migration process from direct Supabase client calls (in the `eventia-backend` folder) to the new Express backend API (in the `eventia-backend-express` folder). The migration centralizes all backend logic into a dedicated Express API, enabling better security, more consistent error handling, and improved separation of concerns.

## Migration Process

### 1. Understand the Current Architecture

The current frontend architecture directly calls Supabase in two ways:

- **Direct Supabase Client Calls**: Using the `supabase` client imported from `@/integrations/supabase/client.ts` to make database queries directly from frontend components.
- **Supabase Service Layer**: Using service files like `eventService` from `@/eventia-backend/services/event.service.ts` that encapsulate Supabase calls.

### 2. New Architecture

The new architecture uses:

- **API Services Layer**: Centralized in `src/services/api/` directory (e.g., `eventApi.ts`, `bookingApi.ts`, `paymentApi.ts`)
- **Express Backend**: Located in `eventia-backend-express/` with proper API routes, controllers, and validation
- **Axios for API Calls**: Consistent HTTP client for all API interactions

### 3. Steps to Migrate a Feature

1. **Create a corresponding API service file** (if it doesn't exist already)
2. **Update imports** in components and hooks to use the new API service
3. **Replace direct Supabase queries** with API calls
4. **Update types** to match the API response structure
5. **Add error handling** for API call failures

## API Service Structure

Each API service follows this pattern:

```typescript
import axios from 'axios';

// Base URL configuration
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Data models/interfaces
export interface SomeModel { /* ... */ }

// API methods
export const someApiMethod = (params) => {
  return api.get<ResponseType>('/endpoint', { params });
};

// Error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error?.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Default export
export default { /* exported methods */ };
```

## Example Migration: Events Feature

### Before (Supabase Direct Calls)

```typescript
// Component
import { eventService } from '@/eventia-backend/services/event.service';

// Usage in component
const fetchEvents = async () => {
  try {
    const events = await eventService.getAllEvents();
    setEvents(events);
  } catch (error) {
    console.error('Error fetching events:', error);
  }
};
```

### After (API Service)

```typescript
// Component
import { getAllEvents } from '@/services/api/eventApi';

// Usage in component
const fetchEvents = async () => {
  try {
    const response = await getAllEvents();
    setEvents(response.data.data);
  } catch (error) {
    console.error('Error fetching events:', error);
  }
};
```

## Handling React Query

For components using React Query, update the queryFn to use the API service:

```typescript
// Before
const { data, isLoading } = useQuery({
  queryKey: ['events'],
  queryFn: async () => {
    const data = await eventService.getAllEvents();
    return data;
  }
});

// After
const { data, isLoading } = useQuery({
  queryKey: ['events'],
  queryFn: async () => {
    const response = await getAllEvents();
    return response.data.data;
  }
});
```

## Type Safety Considerations

1. API responses typically include metadata like `status` and wrap data in a `data` property
2. Create appropriate interfaces for request/response types
3. Consider creating mapping functions to transform API data to component-friendly formats

## Error Handling

1. Use the Axios interceptors pattern for consistent error handling
2. Implement fallback strategies for network errors or API downtime
3. Consider adding retry logic for transient failures

## Authentication

1. Update authentication flow to use the Express backend auth endpoints
2. Handle token storage and refreshing through the API service
3. Ensure authorization headers are properly sent with requests

## Testing Migrated Code

1. Test each migrated feature thoroughly
2. Check edge cases and error scenarios
3. Verify response format handling
4. Test the fallback mechanisms

## Troubleshooting

Common issues:

1. **Incorrect API Base URL**: Ensure `VITE_API_URL` is properly set in your .env file
2. **Response Structure Mismatch**: Check that you're accessing `response.data.data` correctly
3. **Missing Authorization Headers**: Verify auth tokens are being sent properly
4. **CORS Issues**: Check that the Express backend has proper CORS configuration

## Getting Help

If you encounter issues during migration, please:

1. Check the Express backend logs for error details
2. Review the API documentation in the Express backend codebase
3. Contact the backend team for support

## Migration Checklist

- [ ] Create API service files
- [ ] Update component imports
- [ ] Replace Supabase queries with API calls
- [ ] Update types and interfaces
- [ ] Add error handling
- [ ] Test all migrated features
- [ ] Update authentication flow
- [ ] Remove unused Supabase imports and code 