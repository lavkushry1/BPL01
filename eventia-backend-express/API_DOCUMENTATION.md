# Eventia API Documentation

This document provides comprehensive documentation for the Eventia API, including authentication, endpoint details, request/response formats, and error handling.

## API Base URL

```
https://api.eventia.com/api/v1
```

For local development:

```
http://localhost:4000/api/v1
```

## Authentication

Eventia uses JSON Web Tokens (JWT) for authentication. Most endpoints require a valid access token.

### Obtaining Tokens

1. Register a new user or login with existing credentials
2. Store the returned access token and refresh token
3. Include the access token in the Authorization header for protected requests

```
Authorization: Bearer <access_token>
```

### Token Refresh

When the access token expires, use the refresh token to obtain a new one.

## Response Format

All API responses follow a consistent format:

```json
{
  "status": "success|error",
  "data": {
    // Response data (for success)
  },
  "message": "string", // Optional message (present for errors)
  "errors": {} // Validation errors (if applicable)
}
```

## Error Handling

HTTP Status codes are used appropriately:

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `422` - Validation Error
- `500` - Server Error

## API Endpoints

### Authentication

#### Register User

```
POST /auth/register
```

Create a new user account.

**Request Body:**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "user"
}
```

**Response (201):**

```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "USER",
      "createdAt": "2025-05-18T10:00:00Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### Login

```
POST /auth/login
```

Authenticate a user and receive tokens.

**Request Body:**

```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (200):**

```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "USER"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### Refresh Token

```
POST /auth/refresh-token
```

Get a new access token using a refresh token.

**Request Body:**

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200):**

```json
{
  "status": "success",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Users

#### Get User Profile

```
GET /users/profile
```

Get the profile of the currently authenticated user.

**Headers:**

```
Authorization: Bearer <access_token>
```

**Response (200):**

```json
{
  "status": "success",
  "data": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "USER",
    "createdAt": "2025-05-18T10:00:00Z"
  }
}
```

### Events

#### List Events

```
GET /events
```

Get a list of all events with optional filtering.

**Query Parameters:**

- `category` - Filter by event category
- `date_from` - Filter events from this date (YYYY-MM-DD)
- `date_to` - Filter events until this date (YYYY-MM-DD)
- `search` - Search term for title and description
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)
- `sort` - Field to sort by (default: createdAt)
- `order` - Sort order: asc or desc (default: desc)

**Response (200):**

```json
{
  "status": "success",
  "data": {
    "items": [
      {
        "id": "uuid",
        "title": "Concert in the Park",
        "description": "An outdoor concert experience",
        "venue": "Central Park",
        "date": "2025-06-15",
        "time": "18:00",
        "category": "MUSIC",
        "createdAt": "2025-05-18T10:00:00Z",
        "updatedAt": "2025-05-18T10:00:00Z"
      }
    ],
    "total": 50,
    "page": 1,
    "limit": 10,
    "total_pages": 5
  }
}
```

#### Get Event by ID

```
GET /events/:id
```

Get detailed information about a specific event.

**Response (200):**

```json
{
  "status": "success",
  "data": {
    "id": "uuid",
    "title": "Concert in the Park",
    "description": "An outdoor concert experience",
    "venue": "Central Park",
    "date": "2025-06-15",
    "time": "18:00",
    "category": "MUSIC",
    "ticketCategories": [
      {
        "id": "uuid",
        "name": "General",
        "price": 1000,
        "quantity": 100,
        "remaining": 80
      },
      {
        "id": "uuid",
        "name": "VIP",
        "price": 5000,
        "quantity": 20,
        "remaining": 10
      }
    ],
    "createdAt": "2025-05-18T10:00:00Z",
    "updatedAt": "2025-05-18T10:00:00Z"
  }
}
```

#### Create Event

```
POST /events
```

Create a new event (admin only).

**Headers:**

```
Authorization: Bearer <access_token>
```

**Request Body:**

```json
{
  "title": "Concert in the Park",
  "description": "An outdoor concert experience",
  "venue": "Central Park",
  "date": "2025-06-15",
  "time": "18:00",
  "category": "MUSIC",
  "ticketCategories": [
    {
      "name": "General",
      "price": 1000,
      "quantity": 100
    },
    {
      "name": "VIP",
      "price": 5000,
      "quantity": 20
    }
  ]
}
```

**Response (201):**

```json
{
  "status": "success",
  "data": {
    "id": "uuid",
    "title": "Concert in the Park",
    "description": "An outdoor concert experience",
    "venue": "Central Park",
    "date": "2025-06-15",
    "time": "18:00",
    "category": "MUSIC",
    "ticketCategories": [
      {
        "id": "uuid",
        "name": "General",
        "price": 1000,
        "quantity": 100
      },
      {
        "id": "uuid",
        "name": "VIP",
        "price": 5000,
        "quantity": 20
      }
    ],
    "createdAt": "2025-05-18T10:00:00Z",
    "updatedAt": "2025-05-18T10:00:00Z"
  }
}
```

### Bookings

#### Create Booking

```
POST /bookings
```

Create a new booking.

**Headers:**

```
Authorization: Bearer <access_token>
```

**Request Body:**

```json
{
  "eventId": "uuid",
  "tickets": [
    {
      "categoryId": "uuid",
      "quantity": 2
    }
  ],
  "totalAmount": 2000
}
```

**Response (201):**

```json
{
  "status": "success",
  "data": {
    "id": "uuid",
    "eventId": "uuid",
    "userId": "uuid",
    "tickets": [
      {
        "categoryId": "uuid",
        "quantity": 2,
        "unitPrice": 1000,
        "subtotal": 2000
      }
    ],
    "totalAmount": 2000,
    "status": "pending",
    "expiresAt": "2025-05-18T10:30:00Z",
    "createdAt": "2025-05-18T10:00:00Z"
  }
}
```

#### Get Booking by ID

```
GET /bookings/:id
```

Get booking details.

**Headers:**

```
Authorization: Bearer <access_token>
```

**Response (200):**

```json
{
  "status": "success",
  "data": {
    "id": "uuid",
    "eventId": "uuid",
    "userId": "uuid",
    "event": {
      "id": "uuid",
      "title": "Concert in the Park",
      "date": "2025-06-15",
      "time": "18:00",
      "venue": "Central Park"
    },
    "tickets": [
      {
        "categoryId": "uuid",
        "categoryName": "General",
        "quantity": 2,
        "unitPrice": 1000,
        "subtotal": 2000
      }
    ],
    "deliveryDetails": {
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "1234567890",
      "address": "123 Main St",
      "city": "New York",
      "state": "NY",
      "pincode": "10001"
    },
    "payment": {
      "id": "uuid",
      "status": "pending",
      "method": "UPI",
      "amount": 2000
    },
    "totalAmount": 2000,
    "status": "pending",
    "createdAt": "2025-05-18T10:00:00Z"
  }
}
```

#### Save Delivery Details

```
POST /bookings/delivery-details
```

Save delivery details for a booking.

**Headers:**

```
Authorization: Bearer <access_token>
```

**Request Body:**

```json
{
  "bookingId": "uuid",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "1234567890",
  "address": "123 Main St",
  "city": "New York",
  "state": "NY",
  "pincode": "10001"
}
```

**Response (200):**

```json
{
  "status": "success",
  "data": {
    "id": "uuid",
    "bookingId": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "1234567890",
    "address": "123 Main St",
    "city": "New York",
    "state": "NY",
    "pincode": "10001",
    "createdAt": "2025-05-18T10:05:00Z"
  }
}
```

### Payments

#### Initialize Payment

```
POST /payment-initialize
```

Initialize a payment for a booking.

**Headers:**

```
Authorization: Bearer <access_token>
```

**Request Body:**

```json
{
  "bookingId": "uuid",
  "paymentMethod": "UPI"
}
```

**Response (200):**

```json
{
  "status": "success",
  "data": {
    "id": "uuid",
    "bookingId": "uuid",
    "amount": 2000,
    "status": "pending",
    "paymentMethod": "UPI",
    "qrCodeUrl": "https://api.eventia.com/qrcodes/payment_uuid.png",
    "upiId": "eventia@bank",
    "expiresAt": "2025-05-18T11:00:00Z"
  }
}
```

#### Verify UTR

```
POST /verify-utr
```

Submit a UTR number for payment verification.

**Headers:**

```
Authorization: Bearer <access_token>
```

**Request Body:**

```json
{
  "paymentId": "uuid",
  "utrNumber": "123456789012"
}
```

**Response (200):**

```json
{
  "status": "success",
  "data": {
    "id": "uuid",
    "paymentId": "uuid",
    "utrNumber": "123456789012",
    "verificationStatus": "pending",
    "submittedAt": "2025-05-18T10:10:00Z"
  }
}
```

#### Admin: Verify Payment

```
POST /payments/:id/verify
```

Verify a payment (admin only).

**Headers:**

```
Authorization: Bearer <access_token>
```

**Request Body:**

```json
{
  "verified": true,
  "notes": "Payment confirmed in bank statement"
}
```

**Response (200):**

```json
{
  "status": "success",
  "data": {
    "id": "uuid",
    "bookingId": "uuid",
    "amount": 2000,
    "status": "verified",
    "paymentMethod": "UPI",
    "verifiedAt": "2025-05-18T10:15:00Z",
    "verifiedBy": "uuid"
  }
}
```

### Discounts

#### Create Discount

```
POST /discounts
```

Create a new discount code (admin only).

**Headers:**

```
Authorization: Bearer <access_token>
```

**Request Body:**

```json
{
  "code": "SUMMER2025",
  "discount_type": "PERCENTAGE",
  "value": 10,
  "max_uses": 100,
  "expires_at": "2025-09-01T00:00:00Z",
  "is_active": true
}
```

**Response (201):**

```json
{
  "status": "success",
  "data": {
    "id": "uuid",
    "code": "SUMMER2025",
    "discount_type": "PERCENTAGE",
    "value": 10,
    "max_uses": 100,
    "uses": 0,
    "expires_at": "2025-09-01T00:00:00Z",
    "is_active": true,
    "createdAt": "2025-05-18T10:00:00Z"
  }
}
```

#### Verify Discount

```
POST /discounts/verify
```

Verify a discount code.

**Request Body:**

```json
{
  "code": "SUMMER2025"
}
```

**Response (200):**

```json
{
  "status": "success",
  "data": {
    "valid": true,
    "discount": {
      "id": "uuid",
      "code": "SUMMER2025",
      "discount_type": "PERCENTAGE",
      "value": 10,
      "expires_at": "2025-09-01T00:00:00Z"
    }
  }
}
```

### Seats

#### Get Seats for Event

```
GET /seats
```

Get seat availability for an event.

**Query Parameters:**

- `event_id` - Event ID (required)

**Response (200):**

```json
{
  "status": "success",
  "data": {
    "event": {
      "id": "uuid",
      "title": "Concert in the Park"
    },
    "seatMap": {
      "sections": [
        {
          "id": "A",
          "name": "Section A",
          "rows": [
            {
              "id": "1",
              "seats": [
                {
                  "id": "A1",
                  "status": "available",
                  "price": 1000,
                  "categoryId": "uuid"
                },
                {
                  "id": "A2",
                  "status": "locked",
                  "price": 1000,
                  "categoryId": "uuid",
                  "lockedUntil": "2025-05-18T10:15:00Z"
                },
                {
                  "id": "A3",
                  "status": "booked",
                  "price": 1000,
                  "categoryId": "uuid"
                }
              ]
            }
          ]
        }
      ]
    }
  }
}
```

#### Lock Seats

```
POST /seat-locks
```

Lock seats temporarily during the booking process.

**Headers:**

```
Authorization: Bearer <access_token>
```

**Request Body:**

```json
{
  "eventId": "uuid",
  "seatIds": ["A1", "A2"],
  "sessionId": "session_12345"
}
```

**Response (200):**

```json
{
  "status": "success",
  "data": {
    "sessionId": "session_12345",
    "lockedSeats": ["A1", "A2"],
    "expiresAt": "2025-05-18T10:15:00Z"
  }
}
```

#### Unlock Seats

```
DELETE /seat-locks
```

Release locked seats.

**Headers:**

```
Authorization: Bearer <access_token>
```

**Request Body:**

```json
{
  "sessionId": "session_12345"
}
```

**Response (200):**

```json
{
  "status": "success",
  "data": {
    "released": 2
  }
}
```

### Tickets

#### Get Tickets

```
GET /tickets
```

Get tickets for a user or booking.

**Headers:**

```
Authorization: Bearer <access_token>
```

**Query Parameters:**

- `booking_id` - Filter by booking ID

**Response (200):**

```json
{
  "status": "success",
  "data": [
    {
      "id": "uuid",
      "bookingId": "uuid",
      "eventId": "uuid",
      "event": {
        "title": "Concert in the Park",
        "date": "2025-06-15",
        "time": "18:00",
        "venue": "Central Park"
      },
      "categoryName": "General",
      "seatId": "A1",
      "qrCode": "https://api.eventia.com/tickets/ticket_uuid.png",
      "status": "active",
      "createdAt": "2025-05-18T10:15:00Z"
    }
  ]
}
```

### Admin

#### Dashboard

```
GET /admin/dashboard
```

Get admin dashboard statistics (admin only).

**Headers:**

```
Authorization: Bearer <access_token>
```

**Response (200):**

```json
{
  "status": "success",
  "data": {
    "users": {
      "total": 1500,
      "new_today": 25
    },
    "events": {
      "total": 50,
      "active": 45
    },
    "bookings": {
      "total": 3200,
      "today": 120
    },
    "revenue": {
      "total": 3200000,
      "today": 120000
    },
    "payments": {
      "pending_verification": 15
    }
  }
}
```

#### Pending Payments

```
GET /admin/payments/pending
```

Get payments pending verification (admin only).

**Headers:**

```
Authorization: Bearer <access_token>
```

**Query Parameters:**

- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)

**Response (200):**

```json
{
  "status": "success",
  "data": {
    "items": [
      {
        "id": "uuid",
        "bookingId": "uuid",
        "amount": 2000,
        "status": "pending",
        "paymentMethod": "UPI",
        "utrNumber": "123456789012",
        "createdAt": "2025-05-18T10:10:00Z",
        "booking": {
          "id": "uuid",
          "eventId": "uuid",
          "event": {
            "title": "Concert in the Park"
          },
          "user": {
            "name": "John Doe",
            "email": "john@example.com"
          }
        }
      }
    ],
    "total": 15,
    "page": 1,
    "limit": 10,
    "total_pages": 2
  }
}
```

## Rate Limiting

To prevent abuse, the API implements rate limiting:

- Authentication endpoints: 5 requests per 15 minutes per IP
- Standard endpoints: 120 requests per minute per IP or user
- Admin endpoints: 60 requests per minute per admin user

When a rate limit is exceeded, the API returns a 429 Too Many Requests response.

## API Versioning

The current API version is v1. The version is specified in the URL path:

```
/api/v1/...
```

Future API versions will be released as:

```
/api/v2/...
```

## Webhooks

Eventia provides webhooks for real-time event notifications:

- `booking.created`
- `payment.verified`
- `ticket.generated`

Configure webhooks in the admin dashboard.

## Pagination

List endpoints support pagination with the following query parameters:

- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10, max: 100)

The response includes pagination metadata:

```json
{
  "status": "success",
  "data": {
    "items": [...],
    "total": 50,
    "page": 1,
    "limit": 10,
    "total_pages": 5
  }
}
``` 