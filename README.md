# Eventia - Event Ticketing Platform

A comprehensive event ticketing platform with support for seat selection, payments, ticket generation, and real-time communication.

## Features

- Comprehensive event management system
- Seat selection and reservation
- Payment processing with UPI verification
- PDF ticket generation with QR codes
- Real-time notifications via WebSockets
- Background job processing
- Admin dashboard for event management
- Mobile-responsive design
- Multi-language support

## Architecture Overview

The application consists of:

- **Backend**: Node.js, Express, TypeScript, Prisma, PostgreSQL
- **Frontend**: React, TypeScript, Tailwind CSS, Shadcn UI
- **Database**: PostgreSQL for data storage
- **Cache**: Redis for session storage and caching
- **WebSockets**: Socket.IO for real-time communication
- **Background Jobs**: Cron jobs for handling delayed tasks
- **Authentication**: JWT-based authentication

## Prerequisites

- Node.js 20.x
- Docker and Docker Compose
- Git

## Development Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/eventia.git
   cd eventia
   ```

2. Setup environment variables:
   ```bash
   cp eventia-backend-express/.env.example eventia-backend-express/.env
   cp eventia-ticketing-flow1/.env.example eventia-ticketing-flow1/.env
   ```

3. Start the development environment:
   ```bash
   docker-compose up -d
   ```

4. Run database migrations:
   ```bash
   docker exec eventia_backend npx prisma migrate deploy
   ```

5. Seed the database:
   ```bash
   docker exec eventia_backend npm run seed
   ```

6. Access the applications:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:4000
   - API Documentation: http://localhost:4000/api-docs
   - Database Admin: http://localhost:8080

## Production Deployment

### Using Docker Compose

1. Set environment variables for production:
   ```bash
   cp .env.example .env
   # Edit .env with production values
   ```

2. Build and start the production containers:
   ```bash
   NODE_ENV=production docker-compose up -d
   ```

3. Run database migrations:
   ```bash
   docker exec eventia_backend npx prisma migrate deploy
   ```

### Using CI/CD Pipeline

The repository includes a GitHub Actions workflow for CI/CD:

1. Push to the `development` branch for staging deployment
2. Push to the `main` branch for production deployment
3. Set up the following secrets in your GitHub repository:
   - `DOCKERHUB_USERNAME`
   - `DOCKERHUB_TOKEN`
   - `SSH_PRIVATE_KEY`
   - `SSH_KNOWN_HOSTS`
   - `SSH_USER`
   - `SSH_HOST`
   - `DB_PASSWORD`
   - `JWT_SECRET`
   - `REDIS_PASSWORD`
   - `SMTP_USER`
   - `SMTP_PASS`

## Validating the Application

Follow these steps to test the complete flow:

### Event Listing

1. Visit the homepage at http://localhost:5173
2. Browse available events
3. Filter events by category, date, or location
4. Click on an event to view details

### Event Booking

1. Select an event
2. Choose seats or ticket quantity
3. Click "Reserve Seats"
4. Enter attendee information
5. Proceed to payment

### Seat Reservation

1. Select available seats from the seating chart
2. Seats will be temporarily locked for 15 minutes
3. Check that real-time updates show when seats are reserved by others

### Payment

1. Choose UPI payment method
2. Enter UPI details or scan QR code
3. Complete the transaction
4. Return to the application

### UPI Verification

For testing, the admin needs to verify the payment:

1. Login to admin panel (http://localhost:5173/admin)
2. Go to "Pending Payments"
3. Locate the payment and click "Verify"
4. Enter the UTR number to confirm payment

### Ticket Generation

1. Once payment is verified, tickets will be generated automatically
2. You'll receive a real-time notification
3. Go to "My Bookings" to view your tickets
4. Download PDF tickets with QR codes

## API Documentation

The API documentation is available at http://localhost:4000/api-docs when the application is running.

## Security Features

- JWT-based authentication with refresh tokens
- Password hashing using bcrypt
- CORS protection
- Rate limiting
- HTTP security headers
- Docker security best practices
- Non-root user containers
- Input validation

## Troubleshooting

### Common Issues

1. **Database connection errors**: Ensure PostgreSQL is running and credentials are correct
2. **Redis connection errors**: Check Redis connection settings
3. **WebSocket disconnections**: Verify network connectivity and port access
4. **PDF generation failures**: Ensure proper permissions for the storage directories

### Accessing Logs

```bash
# Backend logs
docker logs eventia_backend

# Frontend logs
docker logs eventia_frontend

# Database logs
docker logs eventia_db
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests. 