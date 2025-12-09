# End-to-End Test Plan

## Objective
Verify the complete user journey from booking a ticket to admin verification and ticket generation.

## Prerequisites
- Backend running on port 4000
- Frontend running on port 8080
- Admin user: `admin@eventia.com` / `password123`
- Standard user: `user@eventia.com` / `password123`
- At least one active event in the system

## Test Steps

### 1. User Booking Flow
1.  Open Incognito window (to avoid admin session).
2.  Go to `http://localhost:8080/login`.
3.  Login as `user@eventia.com` / `password123`.
4.  Navigate to `http://localhost:8080/events`.
5.  Select an event (e.g., "IPL Match").
6.  Select seats/tickets.
7.  Proceed to checkout.
8.  Select "UPI" as payment method.
9.  Enter a dummy UTR number (12 digits, e.g., `123456789012`).
10. Submit payment.
11. Verify redirection to confirmation page (Status: Pending Verification).

### 2. Admin Verification Flow
1.  Open a normal browser window.
2.  Go to `http://localhost:8080/admin-login`.
3.  Login as `admin@eventia.com` / `password123`.
4.  Navigate to "Payments" tab (`/admin/payments`).
5.  Verify the new payment with the UTR number appears in the list.
6.  Click "Verify".
7.  Confirm the action.
8.  Verify the payment status changes to "Verified".

### 3. Ticket Generation Verification
1.  Switch back to the User window.
2.  Navigate to "My Tickets" or refresh the confirmation page.
3.  Verify the booking status is "Confirmed".
4.  Check if the "Download Ticket" button is available.

## Troubleshooting
- If payment doesn't appear in admin: Check `booking_payments` table in DB.
- If verification fails: Check backend logs for errors.
- If ticket download fails: Check `generateTickets` controller logs.
