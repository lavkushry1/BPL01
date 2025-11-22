# QA Test Suite: Event Booking & Payment Flow

**Feature:** Event Booking & Payment (UPI Verification)
**Context:** Web Application (React + Node.js/Express)
**User Persona:** Ticket Buyer (Registered User) & Admin
**Tech Stack:** React, Node.js, PostgreSQL, Redis (Seat Locking)

## Test Suite

| Type | Priority | Test Scenario | Step-by-Step Actions | Test Data / Payloads | Expected Result |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Functional** | **P0** | **Happy Path: Successful Booking with Valid UTR** | 1. User selects seats.<br>2. User creates booking.<br>3. User enters valid 12-digit UTR.<br>4. Admin verifies payment. | **Payload (Booking):**<br>`{"event_id": "evt_123", "seats": ["A1", "A2"], "total_amount": 1000}`<br>**Payload (Payment):**<br>`{"utr_number": "123456789012"}` | 1. Booking created (Status: Pending).<br>2. Seats locked.<br>3. Payment status: Verified.<br>4. Tickets generated. |
| **Functional** | **P1** | **Seat Lock Expiration (Boundary: Max Time)** | 1. User selects seats.<br>2. Wait for exactly 15 minutes.<br>3. Attempt to submit payment. | **Timer:** 15m 00s<br>**Action:** Submit Payment | Error: "Session Expired" or "Seats Released". User is redirected to re-selection. |
| **Functional** | **P1** | **Seat Lock Boundary (Boundary: Max - 1s)** | 1. User selects seats.<br>2. Wait for 14 minutes 59 seconds.<br>3. Submit payment immediately. | **Timer:** 14m 59s<br>**Action:** Submit Payment | Payment accepted. Booking proceeds to Pending Verification state. |
| **Functional** | **P2** | **UTR Validation (Invalid Length - Short)** | 1. User attempts to submit payment with 11-digit UTR. | **UTR:** `12345678901` (11 digits) | System should reject input. Error: "UTR must be 12 digits". |
| **Functional** | **P2** | **UTR Validation (Invalid Length - Long)** | 1. User attempts to submit payment with 13-digit UTR. | **UTR:** `1234567890123` (13 digits) | System should reject input. Error: "UTR must be 12 digits". |
| **Negative** | **P1** | **Duplicate UTR Usage** | 1. User A submits valid UTR `123456789012`.<br>2. User B attempts to submit *same* UTR for different booking. | **UTR:** `123456789012` (Used by User A) | Error: "UTR already in use". Prevent duplicate transaction claims. |
| **Negative** | **P1** | **Double Click Payment Submission** | 1. User fills valid payment details.<br>2. User rapidly double-clicks "Submit". | **Action:** Double-click (interval < 300ms) | Frontend prevents 2nd request OR Backend handles idempotency (only 1 booking created). |
| **Security** | **P0** | **SQL Injection in UTR Field** | 1. User attempts to inject SQL payload in UTR field during payment. | **UTR:** `' OR 1=1;--` | System sanitizes input. No DB error exposed. Transaction rejected or treated as invalid string. |
| **Security** | **P0** | **XSS in Attendee Name** | 1. User enters malicious script in "Attendee Name" field.<br>2. Admin views booking in dashboard. | **Name:** `<script>alert('Hacked')</script>` | Script does *not* execute in Admin Dashboard. Input is escaped/encoded. |
| **Security** | **P0** | **IDOR (Booking ID Manipulation)** | 1. User A initiates payment.<br>2. User A intercepts request.<br>3. User A changes `booking_id` to User B's booking ID. | **Payload:**<br>`{"booking_id": "uuid-of-user-b", "amount": 500}` | Error: "Unauthorized" or "Booking does not belong to user". |
| **Performance** | **P2** | **Concurrency: Race Condition on Same Seat** | 1. User A and User B select same seat `A1`.<br>2. Both hit "Reserve" at exact same millisecond. | **Seat:** `A1`<br>**Concurrency:** 2 concurrent requests | Only ONE user gets the lock. The other receives "Seat already reserved". Database integrity maintained. |
| **Implicit** | **P2** | **Network Disconnect during Payment** | 1. User submits payment.<br>2. Network cuts out immediately.<br>3. Network restores. | **Action:** Simulate offline mode | User should be able to retry or check status. App does not crash or hang indefinitely. |
| **Implicit** | **P2** | **Browser Back Button during Processing** | 1. User hits "Submit".<br>2. Spinner appears.<br>3. User hits Browser "Back" button. | **Action:** Browser Back Navigation | User warned "Transaction in progress" OR state is handled gracefully (no zombie bookings). |
| **Destructive** | **P1** | **Parameter Tampering (Price Manipulation)** | 1. User intercepts Booking Creation request.<br>2. Modifies `total_amount` to 1. | **Original:** `1000`<br>**Tampered:** `1` | Backend validates price against server-side seat prices. Rejects booking with "Invalid Amount". |
| **Destructive** | **P1** | **Invalid Seat ID Injection** | 1. User manually calls API with non-existent seat ID. | **Seats:** `["INVALID_SEAT_999"]` | Error: "Seat not found". Server handles gracefully (no 500 crash). |
| **Destructive** | **P1** | **Huge Payload (DoS Attempt)** | 1. User sends booking request with 10,000 seats in array. | **Seats:** Array of 10k strings | Server limits request size or seat count (e.g., max 10 seats/booking). Returns 400 Bad Request. |

## Test Data & Configuration

*   **Test User:** `qa_user@test.com`
*   **Admin User:** `admin@eventia.com`
*   **Valid UTR Format:** 12 digits (numeric)
*   **Seat Lock Duration:** 15 minutes
