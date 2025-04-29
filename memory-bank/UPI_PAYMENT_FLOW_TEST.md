# UPI Payment Flow Test Implementation

## Overview

This document outlines the test implementation for the complete UPI payment flow in Eventia, focusing on the user journey of booking an event ticket through UPI payment.

## User Journey Test Cases

### 1. Event Search Flow

**Test Case ID**: EVT-SEARCH-01
- **Scenario**: User searches for "India vs Australia" cricket match
- **Steps**:
  1. Load homepage
  2. Enter "India vs Australia" in search bar
  3. Apply filters for cricket category
  4. Select upcoming date range
- **Expected Frontend Behavior**:
  - Search results display matching events
  - Event cards show correct details (teams, venue, date)
  - Filter UI properly highlights active filters
- **Expected Backend Response**:
  - `/events` API returns filtered results
  - Response time under 200ms
- **Database Validation**:
  - Query logs show correct filtering parameters
  - Event data matches search criteria

### 2. Seat Selection Flow

**Test Case ID**: EVT-SEAT-01
- **Scenario**: User selects seats for the match
- **Steps**:
  1. Click on event card to view details
  2. Open seat map
  3. Select 2 seats in section B
  4. Click "Continue" to lock seats
- **Expected Frontend Behavior**:
  - Seat map renders with available/unavailable status
  - Selected seats show visual highlight
  - Price calculation updates in real-time
  - 10-minute countdown timer appears
- **Expected Backend Response**:
  - `/seats/lock` API succeeds
  - Returns seat lock confirmation with expiry time
- **Database Validation**:
  - `Seat` table shows seats with `lockedUntil` timestamp
  - `lockedByUserId` field populated correctly

### 3. Delivery Address Flow

**Test Case ID**: EVT-ADDR-01
- **Scenario**: User enters delivery address details
- **Steps**:
  1. Complete delivery form with name, phone, email
  2. Enter shipping address with city and PIN code
  3. Submit form
- **Expected Frontend Behavior**:
  - Form validation works for required fields
  - Phone number format validated
  - PIN code format validated
  - Address saved and displayed in summary
- **Expected Backend Response**:
  - `/booking/initiate` API succeeds
  - Returns booking reference ID
- **Database Validation**:
  - `Booking` table has new record with address details
  - `status` field set to "address_completed"

### 4. UPI QR Payment Flow

**Test Case ID**: EVT-UPI-01
- **Scenario**: User makes payment via UPI QR
- **Steps**:
  1. System displays UPI QR code
  2. User scans QR with UPI app (mock this step)
  3. Complete payment in UPI app (mock this step)
  4. Return to app/website
- **Expected Frontend Behavior**:
  - QR code clearly visible and scannable
  - Deep linking to UPI apps works correctly
  - Payment amount and beneficiary details correct
  - Return instructions displayed clearly
- **Expected Backend Response**:
  - `/payment/generate-qr` returns valid QR with correct UPI ID
  - UPI deep link format correct
- **Database Validation**:
  - `Settings` table has current admin UPI ID
  - `Booking` table status updated to "payment_initiated"

### 5. UTR Submission Flow

**Test Case ID**: EVT-UTR-01
- **Scenario**: User submits UTR after payment
- **Steps**:
  1. Enter UTR number from UPI app
  2. Click "Submit Payment Info"
  3. View confirmation page
- **Expected Frontend Behavior**:
  - UTR field validates input (12-16 alphanumeric)
  - Success screen shows with pending verification message
  - Booking reference displayed for follow-up
- **Expected Backend Response**:
  - `/payment/submit-utr` API succeeds
  - Returns updated booking status
- **Database Validation**:
  - `Booking` table has UTR number stored
  - `paymentStatus` updated to "pending_verification"

### 6. Admin Verification Flow

**Test Case ID**: EVT-ADMIN-01
- **Scenario**: Admin verifies the UTR payment
- **Steps**:
  1. Admin logs into dashboard
  2. Views pending payments list
  3. Checks UTR against bank statement
  4. Approves payment
- **Expected Frontend Behavior**:
  - Admin dashboard displays pending payments
  - UTR details clearly visible
  - Approve/Reject buttons function correctly
  - Confirmation dialog prevents accidental actions
- **Expected Backend Response**:
  - `/admin/verify-payment` API succeeds
  - Returns updated payment status
- **Database Validation**:
  - `Booking` table status updated to "confirmed"
  - `Payment` table status updated to "verified"
  - `verifiedBy` and `verificationTime` fields populated

### 7. Ticket Generation Flow

**Test Case ID**: EVT-TICKET-01
- **Scenario**: System generates ticket after payment verification
- **Steps**:
  1. System processes verified payment
  2. Generates PDF ticket
  3. Sends email notification
  4. Updates booking status
- **Expected Frontend Behavior**:
  - User receives success notification
  - Ticket download link appears
  - Order summary shows completed status
- **Expected Backend Response**:
  - `/tickets/generate` API succeeds
  - Returns ticket download URL
- **Database Validation**:
  - `Ticket` table has new entries
  - `ticketPath` field contains valid PDF path
  - `Booking` status updated to "completed"

## Mobile-Specific Test Cases

### 8. Mobile Payment Experience

**Test Case ID**: EVT-MOB-01
- **Scenario**: User completes flow on mobile device
- **Steps**:
  1. Complete entire flow on mobile device
  2. Test UPI deep linking to apps
  3. Verify responsiveness of all UI elements
- **Expected Results**:
  - All UI elements properly sized for mobile
  - Touch targets minimum 48x48px
  - UPI app launches correctly via deep link
  - Return to app works after payment

### 9. Network Reliability

**Test Case ID**: EVT-NET-01
- **Scenario**: User experiences network fluctuations
- **Steps**:
  1. Simulate poor network during payment flow
  2. Test offline capability during non-critical steps
  3. Verify recovery behavior
- **Expected Results**:
  - Graceful error handling
  - Session persistence through connectivity issues
  - Data saved in localStorage where appropriate
  - Appropriate retry mechanisms

## Performance Test Cases

### 10. Concurrency Testing

**Test Case ID**: EVT-PERF-01
- **Scenario**: Multiple users booking same event
- **Steps**:
  1. Simulate 50 concurrent users viewing same event
  2. Multiple users attempting to lock same seats
  3. Measure system performance and response times
- **Expected Results**:
  - Seat locking mechanism properly handles race conditions
  - System maintains response times under 500ms
  - No database deadlocks or corruption
  - Proper error messages for unavailable seats

## Implementation Notes

1. **Test Environment**:
   - Create isolated test database with sample events and seats
   - Mock UPI payment providers for testing
   - Run tests in multiple browser environments

2. **Test Data Requirements**:
   - Cricket match event data (India vs Australia)
   - Stadium seating layout for Patna stadium
   - Sample UTR numbers for testing
   - Admin test accounts

3. **Automation Approach**:
   - Cypress for E2E frontend testing
   - Jest for API and integration testing
   - Use test recording for visual verification

4. **Test Success Criteria**:
   - All test cases pass in Chrome, Firefox, Safari
   - Mobile tests pass on Android and iOS
   - No critical or high issues found
   - Performance metrics within acceptable range 