# API Routes Documentation

This document provides an overview of the API routes in the Eventia backend.

## Authentication

- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/refresh-token` - Refresh access token
- `POST /api/v1/auth/logout` - User logout
- `POST /api/v1/auth/forgot-password` - Request password reset
- `POST /api/v1/auth/reset-password` - Reset password with token

## Users

- `GET /api/v1/users` - List users (admin only)
- `GET /api/v1/users/:id` - Get user by ID
- `PUT /api/v1/users/:id` - Update user
- `DELETE /api/v1/users/:id` - Delete user
- `GET /api/v1/users/me` - Get current user profile

## Events

- `GET /api/v1/events` - List events
- `GET /api/v1/events/:id` - Get event by ID
- `POST /api/v1/events` - Create event (admin only)
- `PUT /api/v1/events/:id` - Update event (admin only)
- `DELETE /api/v1/events/:id` - Delete event (admin only)

## Bookings

- `GET /api/v1/bookings` - List user bookings
- `GET /api/v1/bookings/:id` - Get booking by ID
- `POST /api/v1/bookings` - Create booking
- `PUT /api/v1/bookings/:id` - Update booking (admin only)
- `DELETE /api/v1/bookings/:id` - Cancel booking

## Payments

- `GET /api/v1/payments` - List user payments
- `GET /api/v1/payments/:id` - Get payment details
- `POST /api/v1/payments/initialize` - Initialize payment
- `POST /api/v1/payments/verify` - Verify payment
- `GET /api/v1/payments/status/:id` - Check payment status

## Tickets

- `GET /api/v1/tickets` - List user tickets
- `GET /api/v1/tickets/:id` - Get ticket details
- `GET /api/v1/tickets/:id/download` - Download ticket PDF
- `POST /api/v1/tickets/validate` - Validate ticket

## Seat Management

- `GET /api/v1/seats` - List available seats
- `GET /api/v1/seats/:id` - Get seat details
- `POST /api/v1/seat-locks` - Lock seat temporarily
- `DELETE /api/v1/seat-locks/:id` - Release seat lock

## Public API

- `GET /api/v1/public/upi` - Get active UPI settings
- `POST /api/v1/public/upi/generate-qr` - Generate QR code for payment

## Admin

- `GET /api/v1/admin/events` - Admin event management
- `GET /api/v1/admin/upi-settings` - List UPI settings
- `GET /api/v1/admin/upi-settings/:id` - Get UPI setting
- `POST /api/v1/admin/upi-settings` - Create UPI setting
- `PUT /api/v1/admin/upi-settings/:id` - Update UPI setting
- `DELETE /api/v1/admin/upi-settings/:id` - Delete UPI setting

## System

- `GET /api/v1/health` - API health check
- `GET /health` - Server health check 