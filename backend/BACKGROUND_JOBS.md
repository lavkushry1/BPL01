# Background Job System

This document outlines the background job system used in the Eventia backend to handle asynchronous tasks that shouldn't block user requests.

## Overview

The application uses a combination of techniques to handle background processing:

1. **Cron Jobs**: Scheduled tasks that run at regular intervals to process queues
2. **Queue Tables**: Database tables storing jobs to be processed
3. **In-memory Timers**: For immediate processing when the server remains running

## Job Types

### Ticket Generation Queue

This queue handles the asynchronous generation of tickets after successful payment verification.

#### How it works:

1. When a payment is verified, the system attempts to generate tickets immediately.
2. If ticket generation fails, the job is added to `ticket_generation_queue` table.
3. The cron job processes this queue every 3 minutes, attempting to generate tickets for pending jobs.
4. Failed attempts increment a counter, and the job is rescheduled with increasing delays.
5. After reaching the maximum attempts, the job is marked as failed and an admin is notified.

#### Queue Schema:

```
ticket_generation_queue
├── id                 (UUID, primary key)
├── booking_id         (UUID, unique, reference to bookings)
├── admin_id           (UUID, who verified the payment)
├── attempts           (INTEGER, number of attempts made)
├── max_attempts       (INTEGER, maximum attempts allowed)
├── next_attempt_at    (TIMESTAMP, when to process next)
├── last_attempt_at    (TIMESTAMP, when last processed)
├── last_error         (TEXT, last error message)
├── status             (TEXT, 'pending' or 'failed')
├── processed_at       (TIMESTAMP, when completed)
└── created_at         (TIMESTAMP, when job was created)
```

### Reservation Expiry Queue

This queue handles the automatic expiration of temporary seat reservations.

#### How it works:

1. When seats are locked during the booking process, an entry is created in `reservation_expiry_queue`.
2. A background job checks every 2 minutes for expired reservations.
3. When a reservation expires, the seats are released back to available status.
4. Users are notified via WebSockets when their reservation expires.

#### Queue Schema:

```
reservation_expiry_queue
├── id                 (UUID, primary key)
├── reservation_id     (UUID, reference to seat_reservations)
├── seat_ids           (JSON, array of seat IDs to release)
├── user_id            (UUID, who made the reservation)
├── expires_at         (TIMESTAMP, when reservation expires)
├── processed          (BOOLEAN, whether it's been processed)
└── created_at         (TIMESTAMP, when job was created)
```

## Implementation Details

### Job Service

The `JobService` class initializes and manages all background jobs:

```typescript
// src/services/job.service.ts
export class JobService {
  static initialize(): void {
    // Release expired seat locks - every minute
    this.registerJob('0 * * * * *', 'release-expired-locks', async () => {
      const releasedCount = await SeatService.releaseExpiredLocks();
    });
    
    // Process expired seat reservations - every 2 minutes
    this.registerJob('0 */2 * * * *', 'process-expired-reservations', async () => {
      const result = await SeatService.processExpiredReservations();
    });
    
    // Process ticket generation queue - every 3 minutes
    this.registerJob('0 */3 * * * *', 'process-ticket-generation-queue', async () => {
      const result = await TicketService.processTicketGenerationQueue();
    });
  }
}
```

### Seat Service

The `SeatService` handles seat locking and reservation management:

```typescript
// src/services/seat.service.ts
export class SeatService {
  // Release expired locks
  static async releaseExpiredLocks(): Promise<number> {
    // Find and release expired locks
    // Notify users via WebSocket
  }
  
  // Process expired reservations
  static async processExpiredReservations(): Promise<number> {
    // Find expired reservations in the queue
    // Release each expired reservation
  }
}
```

### Ticket Service

The `TicketService` manages ticket generation:

```typescript
// src/services/ticket.service.ts
export class TicketService {
  // Process ticket generation queue
  static async processTicketGenerationQueue(): Promise<{
    processed: number,
    success: number,
    failed: number
  }> {
    // Find tickets due for processing
    // Attempt to generate tickets for each booking
    // Handle failures and notify admins if needed
  }
}
```

## Scaling Considerations

The current implementation uses database tables as queues, which works well for moderate loads but could be replaced with dedicated message queue systems like RabbitMQ or Redis for higher throughput in production.

## Error Handling

The system is designed with error resilience in mind:

1. All job processing is wrapped in try/catch blocks
2. Failed jobs are retried with increasing backoff delays
3. After maximum retries, jobs are marked as failed and admins are notified
4. Processing errors are logged but don't crash the application

## Monitoring and Maintenance

- Jobs can be manually triggered through the admin interface
- Failed jobs remain in the database for debugging
- Logs capture processing metrics and errors
- The `fix-queue` script can repair database inconsistencies: `npm run fix-queue` 