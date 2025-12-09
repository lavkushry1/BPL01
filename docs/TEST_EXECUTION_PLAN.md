# Production-Grade Test Execution Plan

## Objective
Complete end-to-end verification of the admin payment verification system and user booking flow with enterprise-level rigor.

## Test Environment Setup

### Phase 1: Environment Stabilization ✓
- [x] Kill zombie processes
- [ ] Start backend server (port 4000)
- [ ] Start frontend server (port 8080)
- [ ] Verify database connectivity

### Phase 2: Backend API Verification
- [ ] Test admin login endpoint
- [ ] Test `/admin/payments` endpoint (Prisma query)
- [ ] Verify payment data structure
- [ ] Test payment verification endpoint

### Phase 3: Frontend Integration Testing
- [ ] Admin login flow
- [ ] Admin payments page data loading
- [ ] Payment verification action
- [ ] UI state updates

### Phase 4: User Booking Flow
- [ ] User login
- [ ] Event browsing
- [ ] Ticket selection
- [ ] UPI payment submission
- [ ] Booking confirmation

### Phase 5: End-to-End Integration
- [ ] Complete user booking with UPI
- [ ] Admin verifies payment
- [ ] User receives confirmation
- [ ] Database state validation

## Test Data

### Admin User
- Email: `admin@eventia.com`
- Password: `password123`
- Role: `ADMIN`

### Test User
- Email: `user@eventia.com`
- Password: `password123`
- Role: `USER`

### Test Payment
- UTR: `123456789012`
- Amount: TBD based on event
- Status: `PENDING` → `VERIFIED`

## Success Criteria

1. **Backend Health**: All API endpoints respond within 500ms
2. **Frontend Stability**: No console errors, proper loading states
3. **Data Integrity**: Database transactions are atomic and consistent
4. **User Experience**: Seamless flow from booking to confirmation
5. **Admin Experience**: Clear payment verification interface

## Known Issues Being Addressed

1. ✓ `setAccessToken` missing in `AuthContext` - FIXED
2. ✓ Refresh token endpoint mismatch - FIXED (changed to `/auth/refresh-token`)
3. ✓ Knex query hanging in `getAllPayments` - FIXED (migrated to Prisma)
4. [ ] CSRF token handling - Currently bypassed for testing
5. [ ] Frontend loading states - Need verification
