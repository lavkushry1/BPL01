# Stripe Payment Integration

## Overview

This document outlines the implementation of Stripe payment gateway integration in the Eventia ticketing platform. The integration allows users to make payments using credit/debit cards through Stripe's secure payment processing system.

## Features

- Secure credit/debit card payments via Stripe
- Payment method selection (UPI or Stripe)
- Real-time payment status updates
- Webhook handling for payment events
- Refund processing capability

## Implementation Details

### Backend Components

1. **Stripe Service (`stripe.service.ts`)**
   - Handles communication with Stripe API
   - Creates and manages payment intents
   - Processes webhooks and verifies signatures
   - Handles refunds

2. **Stripe Controller (`stripe.controller.ts`)**
   - Exposes API endpoints for Stripe operations
   - Processes payment initialization requests
   - Handles webhook events
   - Provides payment status information

3. **Stripe Routes (`stripe.routes.ts`)**
   - Defines API routes for Stripe operations
   - Applies authentication middleware

4. **Configuration (`config/index.ts`)**
   - Manages Stripe API keys and webhook secrets
   - Provides environment-specific configuration

### Frontend Components

1. **Stripe Payment Component (`StripePayment.tsx`)**
   - Renders Stripe Elements for card input
   - Handles payment submission and processing
   - Displays payment status and errors

2. **Payment Method Selector (`PaymentMethodSelector.tsx`)**
   - Allows users to choose between UPI and Stripe payment methods
   - Conditionally renders the appropriate payment component

3. **Payment Flow Component (`PaymentFlow.tsx`)**
   - Orchestrates the overall payment process
   - Displays booking and payment information
   - Handles payment completion and cancellation

## Configuration

### Backend Environment Variables

```
# Stripe Payment Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLIC_KEY=pk_test_your_stripe_public_key
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret
```

### Frontend Environment Variables

```
# Stripe API Keys
REACT_APP_STRIPE_PUBLIC_KEY=pk_test_your_stripe_public_key
```

## API Endpoints

- **POST /api/v1/stripe/payment**
  - Creates a new payment intent
  - Requires authentication
  - Request body: `{ bookingId: string, amount: number, currency?: string }`
  - Response: `{ clientSecret: string, paymentIntentId: string }`

- **POST /api/v1/stripe/webhook**
  - Handles Stripe webhook events
  - No authentication required (uses Stripe signature verification)
  - Request body: Raw webhook payload from Stripe
  - Response: `{ received: true }`

- **GET /api/v1/stripe/payment/:paymentIntentId**
  - Retrieves payment status
  - Requires authentication
  - Response: `{ status: string, amount: number, currency: string }`

## Testing

To test the Stripe integration:

1. Set up the environment variables with Stripe test API keys
2. Use Stripe test card numbers (e.g., 4242 4242 4242 4242)
3. Monitor webhook events using Stripe CLI or dashboard

## Future Improvements

- Add support for saved payment methods
- Implement subscription payments
- Add support for additional payment methods (e.g., Apple Pay, Google Pay)
- Enhance error handling and recovery mechanisms