# Supabase to Express Migration Guide

## Overview

This project has been migrated from using Supabase directly in the frontend to using a dedicated Express backend API. This document outlines the changes made and what developers need to know.

## What Changed

1. **Removed Supabase SDK**: The `@supabase/supabase-js` package has been removed from the frontend.
2. **Replaced Service Layer**: The previous services in `src/eventia-backend/services/` that used Supabase have been replaced with API calls to the Express backend located in `src/services/api/`.
3. **Updated Authentication**: Authentication now uses Express backend endpoints with JWT tokens and HTTP-only cookies rather than Supabase Auth.
4. **Environment Variables**: Supabase URLs and keys have been removed from environment variables.

## How It Works Now

### Authentication Flow
- Login/Registration: Uses `/auth/login` and `/auth/register` endpoints
- Session Management: Uses HTTP-only cookies for refresh tokens and memory for access tokens
- Token Refresh: Automatically handled through `/auth/refresh` endpoint

### Data Access
- All database operations now go through the Express API
- API endpoints follow RESTful conventions
- All requests include appropriate error handling and validation

## API Services

The new API services are located in `src/services/api/` and include:

- `authApi.ts` - Authentication and user management
- `bookingApi.ts` - Booking creation and management
- `discountApi.ts` - Discount code validation and application
- `eventApi.ts` - Event listings and details
- `paymentApi.ts` - Payment processing and verification
- `seatMapApi.ts` - Stadium seating data
- `ticketApi.ts` - Ticket generation and management
- `userApi.ts` - User profile and settings

## For Developers

### Making API Calls

Use the appropriate API service for data operations:

```typescript
import { getEventById } from '@/services/api/eventApi';

// Later in code
const event = await getEventById(eventId);
```

### Error Handling

API services include standardized error handling:

```typescript
try {
  const result = await validateDiscountCode(code, amount);
  // Handle success
} catch (error) {
  // Error is already logged by the API service
  // Handle user-facing error message
}
```

### Environment Variables

Update `.env` with:

```
VITE_API_URL=http://localhost:8080/api
VITE_WS_URL=ws://localhost:8080
```

## Future Considerations

- All new features should use the Express backend API directly
- Any legacy Supabase references in comments should be updated when encountered 