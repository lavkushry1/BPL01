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
    - `authApi.ts`: Authentication service with login/logout/refresh functions
    - `apiUtils.ts`: API client configuration and utilities
- `hooks/`: Custom React hooks
  - `useAuth.ts`: Hook for accessing authentication context
  - `useRefreshToken.ts`: Token refresh functionality
  - `useDiscount.ts`: Hook for discount code management

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
  - `performance/`: Performance monitoring utilities

#### Testing
- `__tests__/`: Test files
  - `e2e/`: End-to-end tests
- `stories/`: Storybook component documentation

## Data Flow Architecture

### Authentication Flow
1. User credentials → `authApi.login()` → JWT generation from backend
2. JWT stored in `AuthContext` + secure storage → Used in API requests
3. Protected routes check auth state via `useAuth()` hook
4. Token refresh on page load via `PersistLogin` component
5. Session timeout monitoring for security via `SessionTimeoutMonitor`
6. Role-based access control via `AdminProtectedRoute`

#### Authentication Sequence
1. User enters credentials in login form
2. `authApi.login()` calls backend authentication endpoint
3. Access token and refresh token returned from backend
4. `AuthContext` stores token in state and in secure storage
5. Token attached to API requests via axios interceptor
6. Expired token automatically refreshed as needed
7. Inactivity timer resets on user interactions
8. Automatic logout after timeout period

### Event Management Flow
1. Admin creates event → `EventController.createEvent` → Database transaction creates related records
2. Event listing → `EventController.getAllEvents` → Paginated, filtered results
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
5. Admin verifies payment → `PaymentController.verifyPayment` → Admin-only endpoint
6. Successful verification → Booking status updated to confirmed → Ticket generation queued
7. Failed verification → `PaymentController.rejectPayment` → Payment can be retried

### Admin Flow
1. Admin login → Protected routes → Admin dashboard
2. Event management → `adminEventApi.ts` → `admin/controllers`
3. Payment verification → `adminApi.ts` → Admin controllers
4. UPI settings → `AdminUpiManagement` → Admin API
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

## Progressive Web App Architecture

### PWA Components
1. **Service Worker**:
   - Located in `public/sw.js`
   - Implements cache-first strategy for static assets
   - Network-first strategy for dynamic content
   - Cache size limitation (5MB) with LRU eviction policy
   - Offline fallback to `offline.html`
   - Background sync capability for offline actions

2. **Web Manifest**:
   - Located in `public/manifest.json`
   - Defines app installation properties
   - Includes icon sets for various platforms
   - Configures shortcuts for quick actions

3. **Service Worker Registration**:
   - Managed via `utils/serviceWorker.ts`
   - Handles registration, updates, and notifications
   - Includes update notification system

### Mobile-First Approach
1. **Network-Aware Loading**:
   - Connection quality detection via navigator.connection
   - Adaptive content loading based on network conditions
   - Data saver mode detection

2. **Performance Optimizations**:
   - DNS prefetch for payment gateways
   - Optimized image loading with format selection
   - Critical CSS inlining
   - Touch target sizing (minimum 48x48px)

3. **Mobile-Specific UI**:
   - Bottom navigation for single-handed operation
   - Haptic feedback for interactions
   - Touch gesture support including swipe and pinch-zoom
   - Safe area inset handling for notched devices 

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