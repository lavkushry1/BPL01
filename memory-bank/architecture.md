# Eventia Architecture Documentation

## Project Structure Overview

The project is organized into two main components:
1. **eventia-backend-express**: Express.js backend API
2. **eventia-ticketing-flow1**: React frontend application

## Backend Architecture (eventia-backend-express)

### Root Structure
- `prisma/`: Prisma ORM configuration and migrations
- `src/`: Source code
- `dist/`: Compiled JavaScript output
- `logs/`: Application logs
- `public/`: Static files (tickets, QR codes)
- `.env.development`: Development environment configuration
- `.env.production`: Production environment configuration
- `.env.example`: Example environment variables for reference

### Source Code Structure (`src/`)

#### Core Application
- `app.ts`: Express application setup and middleware configuration
  - Explicit route registration for all API endpoints with '/api/v1' prefix
  - CORS configuration for frontend access
  - Error handling middleware setup
- `server.ts`: HTTP server initialization and startup

#### API Layer
- `controllers/`: Request handlers separated by domain
  - `admin/`: Admin-specific controllers
  - `event.controller.ts`: Event CRUD operations and specialized event endpoints
  - `booking.controller.ts`: Booking creation and management
  - `payment.controller.ts`: Payment processing and verification
  - `seat.controller.ts`: Seat reservation and management
- `routes/`: API route definitions
  - `v1/`: API version 1 routes
  - `admin/`: Admin-specific routes
  - `event.routes.ts`: Event-related routes with validation schemas
  - `booking.routes.ts`: Booking operations endpoints
  - `payment.routes.ts`: Payment processing endpoints
  - `seat.routes.ts`: Seat reservation endpoints
  - `seat.lock.routes.ts`: Seat locking functionality
- `middleware/`: Express middleware (auth, error handling, validation)
- `validations/`: Request validation schemas

#### Business Logic
- `services/`: Business logic implementation
  - `payment.service.ts`: Payment processing logic
  - `ticket.service.ts`: Ticket generation logic
  - `websocket.service.ts`: Real-time updates for seat status
  - `job.service.ts`: Background job processing
- `repositories/`: Data access layer abstracting database operations

#### Data Layer
- `models/`: Data models and interfaces
  - `seat.ts`: Seat model with validation schemas and status management
  - `payment.model.ts`: Payment data structures and validation
  - `booking.ts`: Booking model with status lifecycle
- `db/migrations/`: Database migration scripts
- `migrations/`: Additional migration utilities

#### Support Components
- `config/`: Application configuration
- `utils/`: Utility functions and helpers
  - `sql/`: SQL query helpers
  - `retry.ts`: Retry mechanism for operations prone to failure
  - `apiError.ts`: Standardized API error handling
  - `apiResponse.ts`: Consistent API response formatting
- `types/`: TypeScript type definitions
- `templates/`: Email and notification templates
- `docs/`: API documentation (Swagger)
- `scripts/`: Utility scripts for maintenance

#### Testing
- `__tests__/`: Test files
  - `e2e/`: End-to-end tests
  - `integration/`: Integration tests
  - `unit/`: Unit tests

## Frontend Architecture (eventia-ticketing-flow1)

### Root Structure
- `src/`: Source code
- `public/`: Static assets
- `dist/`: Production build output
- `nginx/`: Nginx configuration for production

### Source Code Structure (`src/`)

#### Core Application
- `main.tsx`: Application entry point
- `App.tsx`: Root component and routing configuration with React Router
- `index.tsx`: React rendering entry point

#### UI Components
- `components/`: Reusable UI components
  - `admin/`: Admin interface components
    - `AdminAnalytics.tsx`: Interactive analytics dashboard with revenue, user, and event statistics 
    - `AdminPaymentVerification.tsx`: Payment verification interface with tabbed filtering
    - `AdminEventForm.tsx`: Event creation and editing form
    - `UserManagement.tsx`: User management interface for administrators
    - `DiscountList.tsx`: Discount code management component
    - `AdminEntry.tsx`: Admin portal entry point
  - `auth/`: Authentication components
    - `PersistLogin.tsx`: Handles token persistence across page reloads
    - `AdminProtectedRoute.tsx`: Role-based route protection
    - `SessionTimeoutMonitor.tsx`: Auto-logout on inactivity
  - `booking/`: Booking flow components
    - `TicketSelector.tsx`: Enhanced ticket selection interface with animations and real-time total calculation
    - `SeatMap.tsx`: Interactive seat visualization with accessibility and RTL support
    - `DeliveryDetailsForm.tsx`: Form for collecting delivery information with validation
    - `ConfirmationPage.tsx`: Order confirmation with downloadable/shareable tickets
    - `CancelBookingButton.tsx`: Component for booking cancellation with confirmation dialog
  - `events/`: Event-related components
    - `FilterBar.tsx`: Comprehensive filtering component for events with search, category filtering, date range selection, price filtering, and location-based filtering, with responsive design
    - `EventDetail.tsx`: Reusable component for displaying event details
    - `TicketSelector.tsx`: Interactive component for selecting ticket quantities with availability checking
    - `EventInfo.tsx`: Tabbed interface for displaying event information
  - `home/`: Homepage components
  - `layout/`: Layout components (headers, footers)
  - `payment/`: Payment-related components
    - `DiscountForm.tsx`: Discount code application with validation
    - `PaymentStatusPage.tsx`: Display payment status and verification process
    - `DeliveryDetailsForm.tsx`: Detailed form for collecting delivery information
  - `mobile/`: Mobile-specific components
    - `BottomNavigation.tsx`: Mobile-optimized bottom navigation bar with haptic feedback
  - `ui/`: Basic UI components (buttons, inputs, etc.)
    - Component library based on Shadcn UI
    - Responsive design primitives
    - Form controls with validation
    - Layout components (cards, modals, etc.)
    - `steps.tsx`: Multi-step flow visualization component
    - `NetworkStatus.tsx`: Real-time network status indicator
    - `OptimizedImage.tsx`: Enhanced image component with format optimization and lazy loading
  - `utils/`: Utility components (loaders, error boundaries)
    - `SafeTransition.tsx`: Animation wrapper for page transitions

#### Feature Modules
- `features/`: Feature-specific modules
  - `booking/components/`: Booking feature components
  - `events/components/`: Event feature components

#### Pages
- `pages/`: Page components corresponding to routes
  - Public pages (Index, Events, EventDetail, etc.)
    - `EventDetail.tsx`: Comprehensive event details page with ticket selection
    - `Checkout.tsx`: Multi-step checkout flow with ticket selection, delivery details, and payment
    - `Confirmation.tsx`: Order confirmation page with ticket information
    - `DeliveryDetails.tsx`: Dedicated page for delivery information collection
  - Admin pages (AdminDashboardPage, AdminUpiManagement, etc.)
  - Special flows (ARVenuePreview, IPLTickets, etc.)

#### State Management
- `contexts/`: React context providers
  - `AuthContext.tsx`: Global authentication state management
  - `LanguageContext.tsx`: Language settings and switching functionality with RTL support
- `stores/`: State management stores

#### Data Access
- `services/`: Service layer for API communication
  - `api/`: API client implementations by domain
    - `authApi.ts`: Authentication service with login/logout/refresh functions and user registration
    - `apiUtils.ts`: API client configuration with proper API prefixing and utilities
    - `client.ts`: Base API client with correct endpoint path configuration
- `hooks/`: Custom React hooks
  - `useAuth.ts`: Hook for accessing authentication context
  - `useRefreshToken.ts`: Token refresh functionality
  - `useDiscount.ts`: Hook for discount code management

#### Backend Models
- `models/`: Data models for application
  - `user.ts`: User model with automatic UUID generation and role format handling
  - Contains Zod validation schemas for API request validation
  - Implements CRUD operations for user data with proper type handling
- `db/`: Database access layer
  - Implements database connection and query execution
  - Supports transaction management and error handling

#### Authentication System
- `controllers/authController.ts`: Handles authentication requests 
  - Implements user registration with proper role case conversion
  - Manages login with secure password verification
  - Handles refresh token generation and validation with correct type handling
- `routes/auth.ts`: API routes for authentication operations
  - Exposes registration, login, and token refresh endpoints
  - Implements rate limiting for security
  - Includes comprehensive API documentation with Swagger

#### Support Components
- `assets/`: Static assets (images, icons)
- `config/`: Application configuration
- `i18n/`: Internationalization
  - `locales/`: Language translations
    - `en.json`: English translations with comprehensive namespaces
    - `hi.json`: Hindi translations with key feature translation support
  - `config.ts`: i18n setup with language detection, caching, and RTL support
- `lib/`: Third-party library wrappers
- `styles/`: Global styles and themes
  - `ThemeProvider.tsx`: Theme context provider
  - `theme.css`: Global CSS variables and utility classes
- `types/`: TypeScript type definitions
- `utils/`: Utility functions
  - `secureStorage.ts`: Secure token storage utilities
  - `network.ts`: Network-aware utilities for adaptive loading
  - `serviceWorker.ts`: PWA service worker registration and management
    - Implements complete PWA lifecycle management
    - Handles service worker registration with proper error handling
    - Provides update notification mechanisms
    - Manages token refreshing within service worker context
    - Implements controlled page reloads after updates
  - `performance/`: Performance monitoring utilities

#### Testing
- `__tests__/`: Test files
  - `e2e/`: End-to-end tests
- `stories/`: Storybook component documentation

## Data Flow Architecture

### Authentication Flow
- The authentication system implements a complete JWT-based flow:
  1. **Registration Flow**:
     - Client sends user data to `/api/v1/auth/register` 
     - Server validates data, including email uniqueness and password strength
     - Password is hashed using bcrypt before storage
     - User is created with proper role case conversion (lowercase API → uppercase DB)
     - Success response includes user data without password
     
     ```json
     // Request
     POST /api/v1/auth/register
     {
       "name": "John Doe",
       "email": "john@example.com",
       "password": "securePassword123",
       "role": "user"
     }
     
     // Response (201 Created)
     {
       "status": "success",
       "message": "User registered successfully",
       "data": {
         "id": "53f1c8c5-78d9-4b21-a2f2-c5ed79c9d5a1",
         "name": "John Doe",
         "email": "john@example.com",
         "role": "USER",
         "createdAt": "2025-06-01T12:00:00Z",
         "updatedAt": "2025-06-01T12:00:00Z"
       }
     }
     ```
  
  2. **Login Flow**:
     - Client sends credentials to `/api/v1/auth/login`
     - Server validates email exists and password matches
     - Two tokens are generated:
       - Access token (short-lived, 1 hour): Contains user ID, email, and role
       - Refresh token (long-lived, 7 days): Contains only user ID
     - Success response includes both tokens and user data
     
     ```json
     // Request
     POST /api/v1/auth/login
     {
       "email": "john@example.com",
       "password": "securePassword123"
     }
     
     // Response (200 OK)
     {
       "status": "success",
       "message": "Login successful",
       "data": {
         "user": {
           "id": "53f1c8c5-78d9-4b21-a2f2-c5ed79c9d5a1",
           "name": "John Doe",
           "email": "john@example.com",
           "role": "USER",
           "createdAt": "2025-06-01T12:00:00Z",
           "updatedAt": "2025-06-01T12:00:00Z"
         },
         "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
         "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
       }
     }
     ```
  
  3. **Token Refresh Flow**:
     - Client sends refresh token to `/api/v1/auth/refresh-token`
     - Server validates refresh token authenticity and expiration
     - Server generates new access and refresh tokens
     - Success response includes new tokens
     
     ```json
     // Request
     POST /api/v1/auth/refresh-token
     {
       "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
     }
     
     // Response (200 OK)
     {
       "status": "success",
       "message": "Token refreshed successfully",
       "data": {
         "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
         "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
       }
     }
     ```
  
  4. **Protected Resource Access**:
     - Client includes access token in Authorization header
     - Server middleware validates token before allowing access
     - Token validation checks signature, expiration, and payload
     - Role-based access control can be implemented using the role claim
     
     ```
     GET /api/v1/protected-endpoint
     Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
     ```

- JWT Implementation Details:
  - Tokens are signed using HS256 algorithm
  - Access tokens include claims: id, email, role, aud, iss, jti, iat, exp
  - Refresh tokens include minimal claims: id, aud, iss, jti, iat, exp
  - Token verification handles common failure cases: expired, invalid signature, malformed
  - Security enhancements include rate limiting on login attempts (5 per 15 minutes)

### Event Management Flow
1. Admin creates event → `EventController.createEvent` → Database transaction creates related records
2. Event listing → `EventController.getAllEvents` → Paginated, filtered results
   
   ```json
   // Request
   GET /api/v1/events?category=cricket&location=mumbai&startDate=2025-05-01&endDate=2025-05-31&page=1&limit=10
   
   // Response (200 OK)
   {
     "status": "success",
     "message": "Events retrieved successfully",
     "data": {
       "events": [
         {
           "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
           "title": "Mumbai Indians vs Chennai Super Kings",
           "description": "IPL 2025 match at Wankhede Stadium",
           "startDate": "2025-05-15T18:00:00Z",
           "endDate": "2025-05-15T22:00:00Z",
           "location": "Wankhede Stadium, Mumbai",
           "category": "cricket",
           "status": "published",
           "images": [
             {
               "id": "img-123",
               "url": "/events/mi-vs-csk.jpg",
               "alt": "Mumbai Indians vs Chennai Super Kings"
             }
           ],
           "ticketCategories": [
             {
               "id": "tc-123",
               "name": "General Stand",
               "price": 1200,
               "availableQuantity": 5000
             },
             {
               "id": "tc-124",
               "name": "Premium Stand",
               "price": 3000,
               "availableQuantity": 2000
             }
           ]
         },
         // More events...
       ],
       "pagination": {
         "currentPage": 1,
         "totalPages": 3,
         "totalResults": 25,
         "limit": 10
       }
     }
   }
   ```

3. Event details → `EventController.getEventById` → Includes related ticket types and images
4. Event updates → `EventController.updateEvent` → Transaction-based updates with validation
5. Special event types → Custom controllers for IPL matches and other specialized events

### Booking and Seat Reservation Flow
1. User browses available seats → `SeatController.getSeats` → Returns available seats for selection
2. User selects seats → `SeatController.reserveSeats` → Temporary locking with expiration time
3. Seat reservation uses database transaction with row-level locking for atomicity
4. WebSocketService broadcasts seat status changes to all connected clients
5. Automated background job (`SeatModel.releaseExpiredReservations`) releases expired seat locks
6. User provides delivery details → `BookingController.saveDeliveryDetails` → Creates/updates delivery record
7. Booking creation → `BookingController.createBooking` → Transaction ensures data integrity across tables

   ```json
   // Request
   POST /api/v1/bookings
   {
     "eventId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
     "tickets": [
       {
         "ticketCategoryId": "tc-124",
         "quantity": 2
       },
       {
         "ticketCategoryId": "tc-123",
         "quantity": 3
       }
     ],
     "deliveryDetails": {
       "name": "John Doe",
       "email": "john@example.com",
       "phone": "9876543210",
       "address": {
         "line1": "123 Main St",
         "city": "Mumbai",
         "state": "Maharashtra",
         "postalCode": "400001",
         "country": "India"
       }
     },
     "discountCode": "IPL2025"
   }
   
   // Response (201 Created)
   {
     "status": "success",
     "message": "Booking created successfully",
     "data": {
       "booking": {
         "id": "bk-123456",
         "reference": "EVT-12345678",
         "status": "pending_payment",
         "createdAt": "2025-06-02T10:30:00Z",
         "event": {
           "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
           "title": "Mumbai Indians vs Chennai Super Kings"
         },
         "tickets": [
           {
             "id": "tkt-123",
             "ticketCategoryId": "tc-124",
             "name": "Premium Stand",
             "quantity": 2,
             "unitPrice": 3000,
             "totalPrice": 6000
           },
           {
             "id": "tkt-124",
             "ticketCategoryId": "tc-123",
             "name": "General Stand",
             "quantity": 3,
             "unitPrice": 1200,
             "totalPrice": 3600
           }
         ],
         "deliveryDetails": {
           "name": "John Doe",
           "email": "john@example.com",
           "phone": "9876543210",
           "address": {
             "line1": "123 Main St",
             "city": "Mumbai",
             "state": "Maharashtra",
             "postalCode": "400001",
             "country": "India"
           }
         },
         "payment": {
           "id": "pay-123",
           "status": "pending",
           "amount": 9600,
           "discountAmount": 0,
           "totalAmount": 9600,
           "currency": "INR"
         }
       },
       "nextStep": {
         "type": "payment",
         "url": "/payment/bk-123456"
       }
     }
   }
   ```

8. Booking status updates → `BookingController.updateBookingStatus` → Status transitions

### Checkout Flow
1. User selects tickets from either `TicketSelector` or `SeatMap` component
2. User proceeds to multi-step checkout flow via `Checkout.tsx` page
3. First step: User completes `DeliveryDetailsForm` with validation
4. Second step: User proceeds to payment with UPI QR code and UTR input
5. Optional: User applies discount code using `DiscountForm`
6. After payment, order is submitted via `createBooking()` service
7. User is redirected to `Confirmation` page with order details and e-ticket
8. Ticket generation is triggered in the backend

### Payment Processing Flow
1. User initiates payment → `PaymentController.initializePayment` → Creates payment record
2. UPI payment with QR code → User completes payment outside system
3. Mobile-first payment options:
   - **UPI Deep Linking** → Direct app launch with `upi://pay?pa=...` scheme
   - **Intent URL Format** → Android package targeting with fallback URLs
   - **Payment Request API** → Native payment sheet for supported browsers
   - **SMS OTP Fallback** → Feature phone support with SMS-based verification
4. User submits UTR number → `PaymentController.updateUtrNumber` → Records payment verification info
   
   ```json
   // Request
   POST /api/v1/payments/pay-123/utr
   {
     "utrNumber": "123456789012",
     "paymentMethod": "upi",
     "paymentDetails": {
       "upiId": "john@ybl"
     }
   }
   
   // Response (200 OK)
   {
     "status": "success",
     "message": "UTR number submitted successfully. Your payment is under verification.",
     "data": {
       "payment": {
         "id": "pay-123",
         "status": "pending_verification",
         "utrNumber": "123456789012",
         "amount": 9600,
         "currency": "INR",
         "paymentMethod": "upi",
         "createdAt": "2025-06-03T14:25:00Z",
         "updatedAt": "2025-06-03T14:30:00Z"
       },
       "booking": {
         "id": "bk-123456",
         "reference": "EVT-12345678",
         "status": "pending_verification"
       },
       "nextStep": {
         "type": "verification_pending",
         "url": "/bookings/bk-123456/status"
       }
     }
   }
   ```
   
5. Admin verifies payment → `PaymentController.verifyPayment` → Admin-only endpoint
6. Successful verification → Booking status updated to confirmed → Ticket generation queued
7. Failed verification → `PaymentController.rejectPayment` → Payment can be retried

### Admin Flow
1. Admin login → Protected routes → Admin dashboard
2. Event management → `adminEventApi.ts` → `admin/controllers`
3. Payment verification → `adminApi.ts` → Admin controllers
4. UPI settings → `AdminUpiManagement` → Admin API
   
   ```json
   // Request
   PUT /api/v1/admin/settings/upi
   {
     "upiId": "newmerchant@ybl",
     "merchantName": "Eventia Tickets Official",
     "merchantVpa": "eventiatickets@icici",
     "isActive": true
   }
   
   // Response (200 OK)
   {
     "status": "success",
     "message": "UPI settings updated successfully",
     "data": {
       "settings": {
         "id": "ups-123",
         "upiId": "newmerchant@ybl",
         "merchantName": "Eventia Tickets Official",
         "merchantVpa": "eventiatickets@icici",
         "isActive": true,
         "updatedAt": "2025-06-05T15:45:00Z",
         "updatedBy": {
           "id": "user-123",
           "name": "Admin User"
         }
       }
     }
   }
   ```
   
5. Analytics dashboard → `AdminAnalytics` → Statistical visualization
6. User management → `UserManagement` → Admin user controls

### User Interface Architecture
1. **Component Composition**: UI built from smaller, reusable components
   - Shadcn UI-based component library
   - Shared layout components for consistent UI
   - Feature-specific component organization
2. **Page Transitions**: Animated transitions between routes
   - Framer Motion for page animations
   - AnimatePresence for exit animations
   - SafeTransition wrapper component
3. **Responsive Design**: Mobile-first approach
   - Tailwind CSS for responsive utilities
   - Adaptive layouts for different screen sizes
   - Bottom navigation for mobile users
4. **Multi-step Flows**: Structured progression through complex tasks
   - `Steps` component for visual progress indication
   - Form validation at each step
   - Data persistence between steps

## Key Design Patterns

1. **Repository Pattern**: Data access abstracted in repository layer
2. **Service Layer**: Business logic in dedicated service classes
3. **Controller-Service Pattern**: Controllers delegate to services
4. **Context API**: For global state management (auth, theme)
5. **React Query**: For server state management and caching
6. **Component Composition**: UI built from smaller, reusable components
7. **Protected Route Pattern**: Route guards for authentication
8. **Transaction Pattern**: Database operations that span multiple tables use transactions
9. **Publisher-Subscriber Pattern**: WebSockets for real-time updates
10. **Queue Pattern**: Background job processing for deferred tasks
11. **Higher-Order Components**: For shared functionality (PersistLogin, AdminProtectedRoute)
12. **Render Props Pattern**: For component composition and data sharing
13. **Custom Hooks Pattern**: For reusable logic (useAuth, useRefreshToken)
14. **Multi-step Form Pattern**: For complex form flows with validation at each step

## Data Models

### Event Data Model
The Event data model is central to the application and includes:
1. **Core Event Details**: title, description, start/end dates, location
2. **Organizational Properties**: status (draft, published), capacity
3. **Relationships**:
   - Organizer (User who created the event)
   - Ticket Categories (different price tiers)
   - Seats (individual seats for reserved seating)
   - Pricing Rules (for dynamic pricing)
   - Categories (for event classification)
   - Discounts (promotional offers)
4. **Dynamic Pricing**: Rules and logs for price adjustments based on demand/time
5. **Booking Relationships**: Connected to user bookings

### Seat Reservation Model
The seat reservation system is designed for:
1. **Temporary Locking**: Seats are locked for a limited time during user selection
   
   ```json
   // Request
   POST /api/v1/seats/reserve
   {
     "eventId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
     "seats": ["A1", "A2", "A3"],
     "sessionId": "session-e7f8g9h0",
     "reservationDuration": 600 
   }
   
   // Response (200 OK)
   {
     "status": "success",
     "message": "Seats reserved successfully",
     "data": {
       "reservationId": "resv-123456",
       "eventId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
       "seats": [
         {
           "id": "seat-a1",
           "code": "A1",
           "section": "Premium",
           "status": "reserved",
           "price": 3000
         },
         {
           "id": "seat-a2",
           "code": "A2",
           "section": "Premium",
           "status": "reserved",
           "price": 3000
         },
         {
           "id": "seat-a3",
           "code": "A3",
           "section": "Premium",
           "status": "reserved",
           "price": 3000
         }
       ],
       "expiresAt": "2025-06-06T16:20:00Z",
       "totalPrice": 9000,
       "sessionId": "session-e7f8g9h0"
     }
   }
   ```
   
2. **Status Tracking**: Multiple status states (available, locked, booked, reserved, unavailable)
3. **Expiration Handling**: Automatic release of expired locks
4. **Concurrency Control**: Database transactions with row-level locking prevent double bookings
5. **Real-time Updates**: WebSocket notifications when seat status changes

### Booking and Payment Models
The booking and payment systems feature:
1. **Booking Lifecycle**: Status transitions (pending, confirmed, cancelled)
2. **Payment Integration**: UPI payment with verification
3. **Delivery Details**: User contact and delivery information
4. **Admin Verification**: Two-step verification process for payments
5. **Transaction History**: Complete audit trail of payment attempts
6. **Discount Application**: Code-based discounts with validation
   
   ```json
   // Request
   POST /api/v1/discounts/validate
   {
     "code": "IPL2025",
     "eventId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
     "ticketIds": ["tc-123", "tc-124"],
     "subtotal": 9600
   }
   
   // Response (200 OK)
   {
     "status": "success",
     "message": "Discount code applied successfully",
     "data": {
       "discount": {
         "id": "disc-123",
         "code": "IPL2025",
         "type": "percentage",
         "value": 10,
         "description": "10% off IPL 2025 tickets",
         "validFrom": "2025-04-01T00:00:00Z",
         "validTo": "2025-06-30T23:59:59Z",
         "maxUses": 1000,
         "currentUses": 45,
         "minPurchaseAmount": 2000
       },
       "calculation": {
         "subtotal": 9600,
         "discountAmount": 960,
         "total": 8640,
         "discountPercentage": 10
       }
     }
   }
   ```

### Database Schema

The database schema follows a relational model with key entities:
- Users (authentication, roles)
  - Contains hashed passwords, roles, and verification status
  - Linked to refresh tokens for persistent sessions
- Events (event details, status)
- Ticket Categories (pricing tiers)
- Seats (individual seats in venues)
  - Status tracking
  - Reservation expiration
  - Linked to bookings
- Bookings (user reservations)
  - Status lifecycle
  - Payment relationship
  - Delivery details
- Payments (transaction records)
  - UPI verification data
  - Admin verification status
- Discounts (promotional codes)

Relationships are managed through foreign keys with appropriate constraints.

## Async Processing

The system uses:
1. **Background Job Processing**: 
   - Ticket generation after payment confirmation
   - Scheduled cleanup of expired reservations
2. **Reservation Expiry Queue**: 
   - Managing seat holds with automatic release
   - Prevents indefinite seat locking
3. **WebSockets for Real-time Updates**:
   - Seat status changes broadcasted to all clients
   - Prevents double bookings in high-concurrency scenarios
4. **Retry Mechanism**: 
   - Critical operations use retry logic for resilience
   - Handles transient database failures

## Security Implementation

### Authentication Security
1. **Password Handling**: bcrypt for secure password hashing
2. **JWT Implementation**: Short-lived access tokens with refresh token mechanism
3. **Rate Limiting**: Protection against brute force attacks on login
4. **Role-Based Access**: Different permissions for users and admins
5. **Validation**: Zod schema validation on all authentication endpoints
6. **Secure Storage**: Token storage with appropriate security measures
7. **Session Timeout**: Automatic logout after period of inactivity

### API Security
1. **Input Validation**: All API endpoints use Zod schema validation
2. **Authorization Checks**: Role-based middleware for protected routes
3. **Transaction Safety**: Critical operations use database transactions
4. **Error Handling**: Proper error responses without exposing internal details
5. **Atomic Operations**: Database transactions with row-level locking prevent race conditions

### Payment Security
1. **Admin Verification**: Two-step verification process for payments
2. **UTR Validation**: Verification of payment reference numbers
3. **Role-Based Access Control**: Only admins can verify/reject payments
4. **Status Tracking**: Comprehensive payment status lifecycle
5. **Audit Trail**: Complete history of payment operations preserved

### Frontend Security
1. **Protected Routes**: Route guards prevent unauthorized access
2. **Token Management**: Secure token storage and refresh mechanism
3. **Session Monitoring**: Automatic logout on inactivity 
4. **Role Validation**: UI adapts based on user role permissions
5. **Input Sanitization**: Form validations prevent injection attacks

### Environment Configuration
1. Backend configuration is managed through environment variables
2. Sensitive values like JWT secrets and database credentials use environment variables
3. Development fallbacks are provided but production requires proper configuration 

### Internationalization Flow
1. Application initializes with i18n configuration from `i18n/config.ts`
2. `LanguageProvider` renders at the top level of the component tree
3. Language detection via browser settings and localStorage preferences
4. Language context provides current language state and switching functions
5. Components access translations via `useTranslation()` hook
6. Language switcher UI allows users to manually change language
7. RTL detection and document direction management for supporting languages
8. All UI content flows through translation system using namespaced keys 

### Booking Flow UI Architecture
1. Structured as a multi-step process with state persistence:
   - Ticket/seat selection step with real-time availability
   - Delivery details collection with form validation
   - Payment processing with UPI integration
   - Order confirmation with ticket generation
2. Complete internationalization support including RTL languages
3. Responsive design adapts to all device sizes
4. Accessibility features including ARIA labels and keyboard navigation
5. Animation and transition effects enhance user experience
6. Form validation with helpful error messages
7. Discount code application with real-time verification 

### Advanced Seat Selection Architecture
1. **Interactive Seat Map Component**:
   - `InteractiveSeatMap.tsx` - Feature-rich seat selection with mobile optimization
   - Zoom and pan controls with touch-friendly UI elements
   - Section switching with color-coded visualization
   - Seat status management (available, selected, reserved, booked)
   - Automatic seat locking integration
   - Real-time updates via reservation system

2. **Seat Selection Page**:
   - `SeatSelectionPage.tsx` - Main container component for seat selection experience
   - Tabbed interface for different ticket categories (premium, standard, economy)
   - Summary panel displaying selected seats and dynamic pricing information
   - Responsive design with optimized layouts for mobile and desktop
   - Section navigation with intuitive category switching
   - Integration with booking flow and cart management

3. **Seat Reservation System**:
   - Temporary seat locking with automatic expiration
   - Reservation ID tracking for cleanup
   - Optimistic UI updates with server confirmation
   - Consistent status tracking across components

4. **AR Venue Preview**:
   - `useARMode.tsx` - Custom hook for WebXR integration
   - Progressive enhancement based on device capabilities
   - Fallback to marker-based AR for unsupported devices
   - 3D venue visualization with seat highlighting

5. **Dynamic Pricing Engine**:
   - `DynamicPricingInfo.tsx` - Component for displaying pricing information
   - Rule-based price calculations with multiple factor support:
     - Time until event (early bird, last minute)
     - Current inventory levels
     - Demand patterns and booking velocity
     - Bulk purchase discounts
   - Real-time price adjustment visualization
   - Detailed price breakdown with tooltip explanations
   - Transparent savings calculation

6. **Utility & Helper Components**:
   - `formatters.ts` - Comprehensive formatting utilities
   - Progress indicators for pricing information
   - Mobile-optimized tooltip components
   - `seatMapApi.ts` - API service handling seat map data, reservations, and availability

### Shared UI Components
1. **Interactive UI Elements**:
   - Progress component with dynamic value support
   - Card-based information containers
   - Mobile-friendly buttons and controls
   - Touch-optimized elements (minimum 48x48px touch targets)

2. **Real-time Data Flow**:
   - Optimistic UI updates for immediate feedback
   - Server verification with rollback capability
   - Toast notifications for user feedback
   - Background reservation processing

3. **Mobile-First Features**:
   - Scrollable section tabs with overflow handling
   - Collapsible information sections
   - Touch-friendly controls with appropriate spacing
   - Visual cues for interactive elements 

## Progressive Web App (PWA) Implementation

### Service Worker Architecture
- `public/sw.js`: Main service worker implementation
  - Implements caching strategies for different content types:
    - Network-first with cache fallback for HTML navigation
    - Cache-first for static assets (images, CSS, JS)
    - Network-only for API requests to ensure data freshness
  - Special manifest.json handling to prevent body-locked errors
  - Maintains cache size limits (5MB) using LRU eviction policy
  - Comprehensive error handling to prevent uncaught exceptions
  - Implements offline fallback page for navigation requests
  - Adds timestamp headers for cache entry freshness tracking
- `public/offline.html`: Offline fallback page
  - Shows available cached content for offline navigation
  - Automatically attempts reconnection when network is restored
  - Responsive design works on all device sizes
- `src/utils/serviceWorker.ts`: Service worker registration utility
  - Manages service worker lifecycle with proper update detection
  - Implements controlled page reloads after worker updates
  - Provides cache clearing functionality when needed
  - Handles browser compatibility detection

### Offline Capabilities
- Cached assets allow basic app functionality without network
- Critical UI components and styles are pre-cached during installation
- Previously viewed events are available offline
- Automatic reconnection attempts when network is restored
- Graceful degradation strategy for API-dependent features
- Cached translations ensure UI remains in the correct language

## Mobile Security & Accessibility Architecture

### Mobile-First Security

1. **WebAuthn Biometric Authentication**:
   - `webauthn.ts` - Implements FIDO2 standard for passwordless authentication
   - Supports fingerprint, face ID, and other platform authenticators
   - Includes capability detection and graceful fallbacks
   - Provides secure credential management for mobile PWA

2. **Certificate Pinning**:
   - `certificatePinning.ts` - Enhances security against MITM attacks
   - Implements certificate fingerprint validation
   - Configures HSTS headers for secure connections
   - Provides `secureFetch()` for certificate-validated requests

3. **HSTS Configuration**:
   - Strict Transport Security implementation for mobile carriers
   - Header verification and enforcement
   - Upgrade-Insecure-Requests handling
   - Certificate transparency monitoring

### Mobile Accessibility Framework

1. **AccessibilitySettings Component**:
   - `AccessibilitySettings.tsx` - Comprehensive user preferences panel
   - Dynamic font size controls with real-time preview
   - Reduced motion toggle with system preference detection
   - High contrast mode for visibility enhancement
   - Screen reader optimization controls
   - Sound preferences management
   - Persistent settings via localStorage

2. **RTL Language Support**:
   - `RTLProvider.tsx` - Context provider for RTL language direction
   - Automatic document direction switching based on language
   - CSS variable-based directional properties
   - Helper classes for RTL-aware components
   - Text alignment and flexbox direction utilities

3. **Accessibility Hooks**:
   - `useReducedMotion.ts` - Hook for motion preference detection
   - `useScreenReader.ts` - Hook for screen reader detection
   - Both implement system preference detection with user overrides
   - Persistent preferences via localStorage

4. **Lite Mode Support**:
   - `LiteModeBanner.tsx` - Offers lite version for low-end devices
   - Connection quality detection with adaptive behavior
   - Device capability detection (memory, CPU)
   - Seamless transition to lite version
   - Persistent user preferences

### Integration Architecture

1. **CSS Framework Extensions**:
   - Extended theme.css with accessibility-specific variables
   - High contrast color scheme implementation
   - Reduced motion media query support
   - RTL-specific style utilities
   - Screen reader optimized class variants

2. **App-Level Integration**:
   - Accessibility button fixed in viewport for easy access
   - RTL provider at root level for full application support
   - Certificate pinning and HSTS configured on startup
   - WebAuthn capability detection on initial render
   - Lite mode banner with smart detection logic

3. **Touch Optimization Layer**:
   - Minimum 44px touch targets for all interactive elements
   - Proper ARIA role and state management
   - Enhanced focus indicators for touch + keyboard navigation
   - Haptic feedback integration with accessibility features 

## Backend Testing & CI

### Test Directory Structure
- `/tests/unit/`: Unit tests for services, controllers, and utilities
  - Focus on isolated component testing with mocked dependencies
  - Tests individual functions and methods for expected behavior
  - Covers edge cases and error handling

- `/tests/integration/`: Integration test suite
  - Tests API endpoints end-to-end with in-memory test database
  - Verifies complete flows like event creation → booking → payment
  - Tests middleware integrations and request/response handling

### CI Pipeline
- GitHub Actions configuration at `.github/workflows/backend-tests.yml`
- Runs on pull requests and merges to main branch
- Test stages:
  - Linting and TypeScript compilation
  - Unit tests with coverage reporting
  - Integration tests against test database
  - Build verification

### Load Test Scripts
- Located at `/tests/load/`
- Uses k6 for performance testing
- Scripts:
  - `events-load.js`: Tests event listing and filtering performance
  - `booking-flow.js`: Simulates concurrent booking operations
  - `payment-verification.js`: Tests payment verification throughput

## End-to-End Validation

### Three-Layer Validation Approach
The Eventia platform employs a comprehensive three-layer validation approach for every feature, ensuring robustness and reliability across the entire technology stack:

1. **Frontend Validation**
   - **UI/UX Testing**: Every feature is tested for visual correctness, usability, and adherence to design specifications
   - **Tools**: 
     - Playwright for automated E2E browser testing
     - React Testing Library for component testing
     - Cypress for user flow testing
     - Lighthouse for performance and accessibility testing
   - **Validation Process**: 
     - Manual verification of rendered components
     - Automated testing of user interactions
     - Visual regression testing across breakpoints
     - Accessibility compliance checks (WCAG)

2. **Backend Validation**
   - **API Testing**: All endpoints are thoroughly tested for correct behavior, error handling, and performance
   - **Tools**:
     - Jest for unit and integration testing
     - SuperTest for API endpoint testing
     - Postman/Newman for API collections and documentation
     - k6 for load and performance testing
   - **Validation Process**:
     - Request/response validation against schemas
     - Authentication and authorization testing
     - Edge case and error handling verification
     - Rate limiting and security features testing

3. **Database Validation**
   - **Data Persistence**: Ensuring data is properly stored, retrieved, and maintained
   - **Tools**:
     - Prisma CLI for database checks and migrations
     - Database-specific test suites
     - SQL query analyzers for performance
     - Database transaction monitors
   - **Validation Process**:
     - Verify data integrity and relationships
     - Test transaction isolation and rollbacks
     - Check data consistency across operations
     - Monitor query performance and optimization

### Cross-Layer Validation Flows
For critical user journeys, cross-layer validation ensures seamless interaction between all system components:

1. **Event Creation to Publication Flow**
   - Frontend: Admin creates and publishes event with all details
   - Backend: Event validation, processing, and status transitions
   - Database: Event record created with proper relationships to categories, pricing, and images

2. **User Registration to Booking Completion**
   - Frontend: User registers, searches events, selects tickets, and completes payment
   - Backend: Authentication, availability checking, payment processing
   - Database: User record, booking record, payment transaction, and inventory updates

3. **Admin Dashboard to Reporting**
   - Frontend: Admin views analytics, exports reports, and manages settings
   - Backend: Data aggregation, filtering, and export processing
   - Database: Analytics queries, report templates, and configuration storage

### Automated Validation Pipeline
The continuous integration pipeline includes comprehensive validation at all three layers:

1. **Pull Request Validation**
   - Frontend tests must pass (unit, component, integration)
   - Backend tests must pass (unit, integration)
   - Database migrations must apply cleanly
   - Code quality checks (linting, type checking)

2. **Staging Environment Validation**
   - End-to-end Playwright tests run against staging
   - Database consistency checks between environments
   - Performance benchmarks against baseline metrics
   - Security scanning and vulnerability testing

3. **Production Deployment Validation**
   - Canary deployments with traffic splitting
   - Real-user monitoring and error tracking
   - Database performance monitoring
   - Automatic rollback if validation thresholds are exceeded

By implementing this rigorous three-layer validation approach, Eventia ensures that features work correctly across the entire stack, providing a reliable and consistent user experience. 

#### Environment Configuration
- `.env`: Environment variable configuration
  - `eventia-ticketing-flow1/.env`: Frontend environment configuration
    - Configures API endpoint URLs for connecting to the backend
    - Sets feature flags for the application
  - `eventia-backend-express/.env`: Backend environment configuration
    - Configures server port, database connection, JWT settings
    - Defines CORS origins and other security settings
- These files ensure proper synchronization between frontend and backend services
  - Frontend API client connects to the correct backend port
  - Backend server exposes API endpoints with proper prefixes
  - Authentication tokens flow correctly between frontend and backend

#### API Integration
- Authentication flow is synchronized between frontend and backend:
  - Frontend sends requests to `/api/v1/auth/*` endpoints
  - Backend routes handle these requests with proper validation and response formatting
  - JWT tokens are generated by the backend and stored by the frontend
  - Protected routes use token verification for access control
- API clients in the frontend properly handle:
  - Request formatting with correct content types
  - Authentication token inclusion in headers
  - Error handling for various response statuses
  - Automatic token refresh when needed 

## API Testing Framework

### Test Endpoint Scripts (`src/scripts/`)
- `test-endpoints.js`: Comprehensive API endpoint testing utility
  - Tests all major API endpoints in a logical sequence
  - Handles authentication with JWT token management
  - Creates realistic test data with unique identifiers
  - Provides detailed logging of request/response details
  - Uses a modular approach with individual test suites:
    - Authentication endpoint tests (register, login, refresh)
    - Event endpoint tests (listing, creation, modification)
    - Booking endpoint tests (creation, status updates)
    - Payment endpoint tests (initialization, verification)
    - Seat management endpoint tests
    - Discount endpoint tests
    - Admin endpoint tests
  - Suitable for manual testing and CI/CD integration

- `verify-server.js`: Server verification utility
  - Checks if the backend server is running before tests
  - Implements retry logic for transient failures
  - Provides helpful error messages for server startup
  - Used as a prerequisite check before running API tests

- `verify-api-sync.js`: API synchronization verification tool
  - Detects mismatches between frontend API calls and backend routes
  - Prevents 404 errors due to incorrect API paths
  - Validates proper use of the `/api/v1` prefix
  - Reports unused routes and missing endpoint implementations

### API Documentation
- `API_DOCUMENTATION.md`: Comprehensive API documentation
  - Covers all endpoints with request/response formats
  - Includes authentication details and token handling
  - Documents error responses and status codes
  - Provides example payloads for each endpoint
  - Details API versioning approach and pagination
  - Includes rate limiting and security information

### NPM Scripts for API Testing
- `npm run test:api`: Runs the API endpoint tests
- `npm run verify:server`: Checks if the server is running
- `npm run verify:api-sync`: Verifies API synchronization
- `npm run test:api:full`: Runs server verification and API tests

### Integration with Backend Architecture
- Tests validate controller implementations
- Ensures route configurations map correctly to handlers
- Validates proper validation middleware for all endpoints
- Confirms security features like authentication and rate limiting 

## System Health Monitoring

The application includes a comprehensive health monitoring system:

1. **Health Check Endpoint**: 
   - Provides real-time status of all system components
   - Accessible at `/api/v1/health`
   
   ```json
   // Response (200 OK)
   {
     "status": "success",
     "message": "Service is healthy",
     "data": {
       "timestamp": "2025-06-08T10:15:00Z",
       "version": "1.5.2",
       "uptime": 1209600,
       "services": {
         "database": {
           "status": "healthy",
           "responseTime": 15,
           "details": "Connected to database successfully"
         },
         "storage": {
           "status": "healthy",
           "responseTime": 35,
           "details": "Storage service is accessible"
         },
         "cache": {
           "status": "healthy",
           "responseTime": 5,
           "details": "Cache service is responding"
         }
       },
       "environment": "production"
     }
   }
   ```

2. **Service Component Checks**:
   - Database connectivity monitoring
   - Storage service availability
   - Cache service responsiveness
   - Response time tracking for performance analysis

3. **Admin Dashboard Integration**:
   - Visual health status display
   - Automated periodic refresh
   - Alert indicators for service degradation
   - Uptime monitoring and reporting

4. **Operational Features**:
   - Environment information
   - Version tracking
   - System uptime reporting
   - Detailed service status with response times
  
## Admin Event Management Implementation

### Architecture Overview
The admin event management system follows a layered architecture:

1. **Frontend**: Admin interface for event creation and management
   - `AdminEventForm.tsx`: Form component for creating and editing events
   - `adminEventApi.ts`: API service for communicating with backend 
   - Authentication via specialized admin token handling

2. **API Layer**: 
   - RESTful API endpoints under `/api/v1/admin/events`
   - Proper authentication middleware with admin role validation
   - Development-mode special token handling for testing

3. **Controller Layer**:
   - `admin/event.controller.ts`: Specialized handlers for admin operations
   - Transaction-based operations for data integrity
   - Comprehensive error handling and logging

4. **Data Model**:
   - Rich event model with support for:
     - Basic event information (title, description, dates)
     - Multiple images with featured image marking
     - Ticket types with pricing and inventory
     - Team information for sports events
     - Location and venue details

### Development-Specific Adaptations

1. **Mock JWT Token System**:
   - Format-compliant JWT tokens for testing (`header.payload.signature`)
   - Admin role and permissions embedded in payload
   - Special validation middleware for development environment

2. **Test Data Generation**:
   - `create-test-events.js` script for populating sample data
   - Realistic event data modeling IPL cricket matches
   - Complete with images, ticket types, and team information

3. **Authentication Bypass**:
   - Special middleware for development-only token handling
   - Conditional logic based on environment
   - Strict validation in production, more permissive in development

### API Flow

1. Admin authenticates via `/api/v1/auth/login` or test credentials
2. System generates token with admin role
3. Token included in Authorization header for requests to `/api/v1/admin/events`
4. Admin middleware validates token and admin role
5. Controller handles request and performs data operations
6. Response sent back to frontend with appropriate status and data
7. Frontend displays success/error message and updates UI

### Token Structure

For development and testing, the token structure is:
```
header.payload.signature
```

Where:
- **header**: Base64-encoded JSON with `{ "alg": "HS256", "typ": "JWT" }`
- **payload**: Base64-encoded JSON with user data including `id`, `email`, `role: "admin"`, `iat` (issued at), `exp` (expiration)
- **signature**: Base64-encoded mock signature (real signature in production)

This implementation ensures complete end-to-end testing capabilities while maintaining security best practices for production environment. 

## Admin Event to Public Event Integration (2025-06-13)

### Files Modified:
- `eventia-ticketing-flow1/src/pages/AdminEventManagement.tsx`
  - Enhanced localStorage persistence system for admin-created events
  - Improved data format conversion between IPLMatch and Event interfaces
  - Added robust error handling for localStorage operations
  - Fixed initial data loading to properly restore events after page refresh
  - Implemented custom event dispatch system for real-time updates
  - Added better toast notifications for localStorage operations

- `eventia-ticketing-flow1/src/pages/Events.tsx`
  - Enhanced event listener system to respond to both storage and custom events
  - Improved initialization to check for existing admin events on component mount
  - Added fallback to mock data when no events are available from any source
  - Fixed data source statistics to properly track and display event origins
  - Added explicit setting of event source property for better tracking

- `eventia-ticketing-flow1/src/components/events/EventCard.tsx`
  - Restored "Book Now" button alongside "View Details" button
  - Implemented conditional rendering to hide booking button for sold-out events
  - Enhanced visual indicators for different event sources (admin, API, mock)
  - Improved layout and styling for buttons and badges

### Data Flow Architecture:
1. **Event Creation in Admin Interface**:
   - Admin creates or edits an event in AdminEventManagement.tsx
   - Event data is converted from IPLMatch format to Event format
   - Converted data is stored in localStorage under 'admin_created_events' key
   - Both a standard storage event and a custom 'admin-events-updated' event are dispatched

2. **Event Consumption in Public Interface**:
   - Events.tsx listens for both storage and custom events
   - On page load or event trigger, the component:
     - Fetches events from API if available
     - Loads admin events from localStorage
     - Merges both sources with proper source tracking
     - Falls back to mock data if no real events are available
   - Admin events are clearly marked with visual indicators

3. **Real-time Synchronization**:
   - When admin edits or deletes an event, changes are immediately reflected in localStorage
   - Custom events ensure the public page is notified even when storage events aren't triggered
   - The Events page immediately refetches and redisplays events when notified
   - This creates a seamless real-time experience for testing new events

4. **Visual Source Indication**:
   - Events display source badges (Admin, API, Mock) for transparency
   - Admin events have distinctive styling to highlight their origin
   - Data source statistics show counts from each source

5. **Error Handling & Resilience**:
   - Robust error handling for localStorage operations
   - Fallback mechanisms when data is corrupted or unavailable
   - Type checking to ensure data integrity
   - Default values for missing properties

This implementation provides a complete end-to-end solution for admin users to create, test, and publish events without requiring backend deployment, significantly improving workflow efficiency while maintaining a clear distinction between different data sources.

## Navigation Flows

### Event Browsing to Detail Flow
1. User views events list on `/events` page
   - Components: Events.tsx page with EventCard.tsx components
   - Data loaded from: eventApi.getEvents() with filtering options
2. User clicks "View Details" or "Book Now" buttons on an event card
   - Both buttons navigate to the same route: `/events/:id`
   - Implemented with React Router's `<Link to={`/events/${event.id}`}>` component
3. EventDetail page (`/events/:id`) loads
   - Fetches detailed event information from eventApi.getEvent(id)
   - Displays comprehensive event information with ticket selection
4. From EventDetail page, user can:
   - Select tickets and continue to booking
   - Return to events listing
   - View venue in AR preview
5. EventDetail page handles the booking creation flow:
   - User selects tickets or seats
   - Booking data is stored in sessionStorage
   - User is navigated to payment flow

### Booking Flow
1. User creates booking from EventDetail page
2. User enters delivery information on DeliveryAddressPage
   - Can navigate back to event detail with `<Link to={`/events/${eventId}`}>`
3. User completes payment process
4. Booking confirmation displayed

## Payment Processing System

### UPI Payment Integration
- The UPI payment system is implemented with a robust architecture that handles both authenticated and unauthenticated scenarios:

1. **API Layer**
   - `paymentApi.ts`: Centralized payment API service
     - Now includes fallback mechanisms for authentication failures
     - Implements a resilient multi-endpoint strategy for UPI settings retrieval
     - Uses localStorage token with consistent key naming from apiUtils
     - Provides comprehensive error handling with default fallbacks
   - `client.ts`: Base API client
     - Uses consistent ACCESS_TOKEN_KEY for authentication headers
     - Improved error handling for 401 responses
   - Public endpoints in Express:
     - `/api/v1/admin/upi-settings/active`: Non-authenticated endpoint for active UPI settings
     - `/api/v1/payments/generate-qr`: Public QR code generation endpoint

2. **UI Components**
   - `UpiPayment.tsx`: Core payment component
     - Implements generateQrCode helper for better code organization
     - Added refreshQrCode function that handles auth failures gracefully
     - Includes comprehensive error handling with user-friendly messages
     - Provides fallbacks when API calls fail
   - `usePaymentSettings.tsx`: Settings management hook
     - Now tries multiple endpoints with proper error handling
     - Implements fallback to default values when needed
     - Provides consistent interface regardless of data source

3. **Backend Implementation**
   - `app.ts`: Express application setup
     - Added public endpoints that bypass authentication
     - Implemented UPI settings endpoint without auth requirement
     - Created QR code generation endpoint that works without authentication
   - `upiSettings.routes.ts`: UPI settings API routes
     - Separated public and protected endpoints
     - Maintained compatibility with existing admin interfaces

This architecture ensures the payment system works reliably in all scenarios, even when authentication is not available. The system prioritizes user experience by providing graceful fallbacks and clear error messaging throughout the payment flow.

## UPI Payment Flow Architecture

The UPI payment flow has been enhanced to ensure it always uses the admin-configured UPI ID from the database:

### Backend Components

1. **Authentication Middleware**: (`middleware/auth.ts`)
   - Implements a list of public endpoints that bypass authentication
   - Includes UPI settings and QR code generation endpoints in this list
   - Provides fallback mechanisms for authentication failures

2. **UPI Settings Controller**: (`controllers/admin/upiSettings.controller.ts`)
   - `getActiveUpiSetting` method fetches the active UPI setting from the database
   - Provides robust error handling with fallback to default UPI ID (`9122036484@hdfc`)
   - Returns consistent response format for both success and error cases

3. **Public Endpoints**: (`app.ts` and `routes/v1/index.ts`)
   - Public endpoint for UPI settings at `/api/v1/payments/upi-settings`
   - Public endpoint for QR code generation at `/api/v1/payments/generate-qr`
   - Both endpoints bypass authentication to ensure payment flow works regardless of auth state

### Frontend Components

1. **UPI Payment API**: (`services/api/paymentApi.ts`)
   - `getActiveUpiSettings` function fetches UPI settings from public endpoint
   - `generateUpiQrCode` function creates QR codes with proper UPI ID
   - Multilayered fallback mechanisms to ensure functionality even if API calls fail

2. **Payment Components**: (`components/payment/UpiPayment.tsx`)
   - Uses the admin-defined UPI ID for QR code generation
   - Implements multiple QR generation methods with fallbacks
   - Ensures no hardcoded UPI IDs are used in the payment flow

3. **Payment Hooks**: (`hooks/use-payment-settings.tsx`)
   - Provides a centralized way to access payment settings
   - Includes proper fallback to the default UPI ID if API calls fail

### Data Flow

1. Admin configures UPI ID in the admin panel, storing it in the `upi_settings` table
2. During payment flow, frontend calls the public endpoint to retrieve the active UPI ID
3. QR code is generated using the retrieved UPI ID (or falls back to default if needed)
4. User scans the QR code and completes payment with the correct merchant UPI ID

This architecture ensures that payments are always directed to the correct UPI ID as configured by the admin, with appropriate fallbacks to maintain functionality in all scenarios.
