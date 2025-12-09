# API Routes Migration Checklist

This document tracks the progress of migrating legacy routes to the new v1 API structure.

## Directory Structure

```
/src/routes/
  /v1/                  # New API version 1
    /admin/             # Admin-only routes
      index.ts          # Admin routes aggregation
      [resource].routes.ts  # Resource-specific admin routes
    /public/            # Public-facing routes (no auth required)
      index.ts          # Public routes aggregation
      [resource].routes.ts  # Resource-specific public routes
    index.ts            # Main aggregation of v1 routes
    [resource].routes.ts  # Resource-specific routes (auth required)
```

## Standards for New Routes

- Use consistent naming: `[resource].routes.ts`
- Group routes by access level: admin/, public/, or root for authenticated users
- Apply consistent middleware patterns:
  - Admin routes: Always use `auth('ADMIN')` middleware
  - Public routes: Consider rate limiting with `standardLimiter`
  - Auth routes: Use `auth()` middleware
- Use Zod schemas for validation consistently
- Use asyncHandler for all controller methods
- Follow RESTful conventions for endpoints
- Use ApiResponse utility for standardized responses

## Migration Status

| Resource | Legacy Route | New Route | Status | Notes |
|----------|--------------|-----------|--------|-------|
| UPI Settings | ✅ | ✅ | Complete | admin/upiSettings.routes.ts |
| UPI | ✅ | ✅ | Complete | public/upi.routes.ts |
| Auth | ✅ | ✅ | Complete | v1/auth.routes.ts |
| User | ✅ | ✅ | Complete | v1/user.routes.ts + admin/user.routes.ts |
| Events | ✅ | ✅ | Complete | v1/event.routes.ts + admin/event.routes.ts |
| Bookings | ✅ | ❌ | Not Started | Still in legacy routes/booking.routes.ts |
| Payments | ✅ | ⚠️ | Partial | Basic payment routes migrated |
| Discounts | ✅ | ❌ | Not Started | Still in legacy routes/discount.routes.ts |
| Seats | ✅ | ❌ | Not Started | Still in legacy routes/seat.routes.ts |
| Seat Locks | ✅ | ❌ | Not Started | Still in legacy routes/seat.lock.routes.ts |
| Ticket Categories | ✅ | ❌ | Not Started | Still in legacy routes/ticketCategory.routes.ts |
| Tickets | ✅ | ❌ | Not Started | Still in legacy routes/ticket.routes.ts |
| UTR Verification | ✅ | ❌ | Not Started | Still in legacy routes/utrVerification.routes.ts |
| Health | ✅ | ❌ | Not Started | Still in legacy routes/health.routes.ts |
| State Sync | ✅ | ❌ | Not Started | Still in legacy routes/stateSync.routes.ts |

## Migration Priority

1. **High Priority**
   - ✅ Auth routes (core functionality)
   - ✅ User routes (core functionality)
   - ✅ Events routes (frequently used)

2. **Medium Priority**
   - Bookings routes
   - Payments routes
   - Tickets routes

3. **Lower Priority**
   - Discount routes
   - UTR Verification
   - Health checks
   - State sync

## Improvements Made

1. ✅ Added Redis dependencies (redis and rate-limit-redis)
2. ✅ Created standardized templates for admin and public routes
3. ✅ Implemented errorBoundary middleware for consistent error handling
4. ✅ Migrated Auth routes to v1 structure
5. ✅ Migrated User routes to v1 structure with proper separation of admin functionality
6. ✅ Migrated Event routes to v1 structure with proper separation of admin functionality
7. ⚠️ Improved authorization logic in admin routes (partially applied)

## Known Issues to Address

1. ⚠️ Mixed parameter validation approaches (some using Zod, others using manual validation)
2. Update remaining routes following the established patterns
3. Standardize all error responses using the new errorBoundary middleware 