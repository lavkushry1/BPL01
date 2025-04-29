# UPI Payment Flow - Eventia Platform

## Overview

The Eventia platform implements a custom UPI payment flow that allows users to make payments directly via UPI without using a payment gateway intermediary. This document outlines the architecture, data flow, security considerations, and implementation details of this payment method.

## Architecture

The UPI payment system follows a **manual verification workflow** where:

1. The system displays payment information and QR code to the user
2. User makes payment using any UPI app
3. User submits UTR (Unique Transaction Reference) number
4. Backend stores the UTR for verification
5. Admin verifies the payment
6. System confirms the booking

### Component Diagram

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Frontend   │     │   Backend    │     │   Database   │     │ Admin Portal │
│  (React.js)  │◄───►│  (Express)   │◄───►│  (MongoDB)   │◄───►│  (React.js)  │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
       │                     │                                        │
       │                     │                                        │
       ▼                     ▼                                        ▼
┌──────────────┐     ┌──────────────┐                      ┌──────────────┐
│  QR Code &   │     │ UTR Storage & │                      │ Payment      │
│ UPI Deep Link│     │  Validation   │                      │ Verification │
└──────────────┘     └──────────────┘                      └──────────────┘
```

## Data Flow

### 1. Initiating Payment

```
┌──────────┐                 ┌────────────┐                   ┌────────────┐
│  Client  │                 │  Backend   │                   │  Database  │
└────┬─────┘                 └─────┬──────┘                   └─────┬──────┘
     │                             │                                │
     │  GET /api/payments/settings │                                │
     │────────────────────────────►│                                │
     │                             │                                │
     │                             │   Query active UPI settings    │
     │                             │───────────────────────────────►│
     │                             │                                │
     │                             │◄───────────────────────────────│
     │                             │                                │
     │◄────────────────────────────│                                │
     │  Returns UPI ID & QR code   │                                │
     │                             │                                │
     │  User scans QR code with    │                                │
     │  UPI app and makes payment  │                                │
     │─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ►                                │
```

### 2. Submitting UTR Number

```
┌──────────┐                 ┌────────────┐                   ┌────────────┐
│  Client  │                 │  Backend   │                   │  Database  │
└────┬─────┘                 └─────┬──────┘                   └─────┬──────┘
     │                             │                                │
     │  POST /api/payments/upi     │                                │
     │  {bookingId, utrNumber}     │                                │
     │────────────────────────────►│                                │
     │                             │                                │
     │                             │  Validate UTR (uniqueness,     │
     │                             │  format)                       │
     │                             │───────────────────────────────►│
     │                             │                                │
     │                             │◄───────────────────────────────│
     │                             │                                │
     │                             │  Insert payment record with    │
     │                             │  status "PENDING_VERIFICATION" │
     │                             │───────────────────────────────►│
     │                             │                                │
     │                             │◄───────────────────────────────│
     │                             │                                │
     │◄────────────────────────────│                                │
     │  Returns success message    │                                │
     │                             │                                │
```

### 3. Admin Verification

```
┌──────────┐                 ┌────────────┐                   ┌────────────┐
│  Admin   │                 │  Backend   │                   │  Database  │
└────┬─────┘                 └─────┬──────┘                   └─────┬──────┘
     │                             │                                │
     │  GET /api/admin/payments    │                                │
     │────────────────────────────►│                                │
     │                             │                                │
     │                             │  Query pending payments        │
     │                             │───────────────────────────────►│
     │                             │                                │
     │                             │◄───────────────────────────────│
     │                             │                                │
     │◄────────────────────────────│                                │
     │  Returns pending payments   │                                │
     │  with UTR numbers           │                                │
     │                             │                                │
     │  Admin verifies payment     │                                │
     │  in bank statement          │                                │
     │                             │                                │
     │  PATCH /api/admin/payments/:id                               │
     │  {status: "VERIFIED"}       │                                │
     │────────────────────────────►│                                │
     │                             │                                │
     │                             │  Update payment status         │
     │                             │───────────────────────────────►│
     │                             │                                │
     │                             │◄───────────────────────────────│
     │                             │                                │
     │◄────────────────────────────│                                │
     │  Returns success            │                                │
     │                             │                                │
```

### 4. Payment Confirmation

```
┌──────────┐                 ┌────────────┐                   ┌────────────┐
│  Admin   │                 │  Backend   │                   │  WebSocket │
└────┬─────┘                 └─────┬──────┘                   └─────┬──────┘
     │                             │                                │
     │  PATCH /api/admin/payments/:id                               │
     │  {status: "VERIFIED"}       │                                │
     │────────────────────────────►│                                │
     │                             │                                │
     │                             │  Emit payment verified event   │
     │                             │───────────────────────────────►│
     │                             │                                │
     │                             │  Send email confirmation       │
     │                             │                                │
     │                             │  Generate ticket PDF           │
     │                             │                                │
     │◄────────────────────────────│                                │
     │  Returns success            │                                │
     │                             │                                │
```

## Data Model

### Payment Collection

```json
{
  "id": "string",
  "bookingId": "string",
  "userId": "string",
  "amount": "number",
  "currency": "string",
  "paymentMethod": {
    "type": "string", // "UPI"
    "upiDetails": {
      "vpa": "string",
      "utrNumber": "string"
    }
  },
  "status": "string", // "PENDING", "PENDING_VERIFICATION", "VERIFIED", "REJECTED", "AMOUNT_MISMATCH"
  "verifiedAt": "date",
  "verifiedBy": "string",
  "rejectedReason": "string",
  "createdAt": "date",
  "updatedAt": "date"
}
```

### UPI Settings Collection

```json
{
  "id": "string",
  "vpa": "string", // "eventia@okicici"
  "merchantName": "string", // "Eventia Events"
  "merchantCode": "string", // "EVENTIATICKET"
  "discountPercentage": "number", // Optional discount for UPI payments
  "isActive": "boolean",
  "createdAt": "date",
  "updatedAt": "date"
}
```

## Security Considerations

1. **UTR Number Validation**:
   - Check uniqueness to prevent duplicate submissions
   - Basic format validation (alphanumeric, 12-22 characters)
   - Rate limiting on attempts

2. **Admin Verification**:
   - Multi-level verification (basic admin and super-admin)
   - Audit logging of all verification actions

3. **Fraud Prevention**:
   - Track suspicious patterns (multiple UTRs with minor variations)
   - IP tracking for multiple submission attempts

4. **Data Protection**:
   - PII data encryption in transit and at rest
   - Tokenization of sensitive data
   - Compliance with financial data regulations

## Frontend Implementation

The UPI payment UI consists of:

1. **UPI ID Display** with copy function
2. **QR Code** generation for scanning
3. **Direct Open Links** for mobile UPI apps
4. **UTR Input Form** with validation
5. **Status Indicators** during processing

```jsx
// Example UpiPayment.tsx component structure
function UpiPayment({ bookingId, amount, customerInfo, onSuccess }) {
  // State management for UPI ID, QR code, UTR input
  // API calls to fetch payment settings and submit UTR
  // Copy to clipboard functionality
  // Mobile deep linking
  
  return (
    <Card>
      <CardHeader>UPI Payment</CardHeader>
      <CardContent>
        {/* UPI ID display with copy button */}
        {/* QR Code display */}
        {/* Mobile app links (on mobile devices) */}
        {/* UTR input form */}
        {/* Submit button */}
      </CardContent>
    </Card>
  );
}
```

## Backend Implementation

### API Endpoints

1. `GET /api/payments/settings`
   - Returns active UPI VPA and payment settings

2. `GET /api/payments/generate-upi-qr`
   - Generates QR code for the payment
   - Parameters: amount, reference

3. `POST /api/payments/upi`
   - Records UTR number for verification
   - Parameters: bookingId, utrNumber

4. `GET /api/admin/payments`
   - Lists payments for admin verification
   - Supports filtering by status and date range

5. `PATCH /api/admin/payments/:id`
   - Updates payment status after verification
   - Parameters: status, verifierNotes

### Batch Processing

The system supports batch verification through:
- CSV upload for bulk UTR processing
- Automated bank statement reconciliation tools

## Error Handling

1. **UTR Submission Errors**:
   - Invalid format: Returns error with validation rules
   - Duplicate UTR: Notifies user of existing submission
   - System errors: Logs details and returns friendly message

2. **Verification Errors**:
   - Amount mismatch: Flagged for manual verification
   - Invalid UTR: Marked as rejected with reason
   - Multiple submissions: Auto-flagged for review

## Testing

1. **Unit Tests**: For validation logic, UTR format checks
2. **Integration Tests**: API endpoints, database operations
3. **End-to-End Tests**: Complete payment flow simulation
4. **Manual Testing**: Real device testing with actual UPI apps

## Deployment

1. **Staging Environment**: Sandbox for testing with mock UTRs
2. **Production Rollout**: Gradual release with monitoring
3. **Monitoring**: Real-time alerts for abnormal patterns

## Future Enhancements

1. **Auto-Verification**: Integrate with banking APIs for automatic verification
2. **Multiple VPAs**: Support for multiple UPI IDs with load balancing
3. **Advanced Analytics**: Dashboard for payment trends and patterns
4. **AI Fraud Detection**: Machine learning to detect suspicious patterns

## Conclusion

The UPI Payment Flow implementation provides a direct payment option without relying on payment gateways, reducing transaction fees and giving more control over the payment process. The system prioritizes security, user experience, and admin verification workflows to ensure payments are properly tracked and verified. 