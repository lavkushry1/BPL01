# Schema Migration Guide

This guide provides instructions for migrating to the optimized database schema. The changes include:

1. Converting string status fields to enums
2. Adding proper relationships and indexes
3. Creating explicit join tables for many-to-many relationships
4. Adding soft delete functionality
5. Implementing better audit trails
6. Adding database triggers and materialized views for analytics
7. Creating partial and covering indexes for performance

## Prerequisites

- Backup your database before proceeding
- Stop all running application instances
- Have at least 15 minutes of downtime available

## Step 1: Prepare the Migration

```bash
# Generate the Prisma client with the updated schema
npx prisma generate

# Create migration directories
mkdir -p prisma/migrations/20240601_optimize_schema
mkdir -p prisma/migrations/20240602_additional_optimizations
```

## Step 2: Apply Database Changes

```bash
# Apply the first migration SQL
psql -d your_database_name -f prisma/migrations/20240601_optimize_schema/migration.sql

# Apply the additional optimizations
psql -d your_database_name -f prisma/migrations/20240602_additional_optimizations/migration.sql

# OR use Prisma migrate (development environment)
npx prisma migrate dev --name optimize_schema
npx prisma migrate dev --name additional_optimizations
```

## Step 3: Migrate Existing Data

```bash
# Run the migration script to populate new tables
npx ts-node scripts/migrate-data.ts
```

## Step 4: Update Application Code

The following files need to be updated to use the new schema:

1. **Enum Changes**:
   - Update Seat status to use the SeatStatus enum
   - Update Ticket status to use the TicketStatus enum

2. **New Relationships**:
   - Update queries to use the BookedSeat model instead of JSON fields
   - Update queries to use PaymentSessionSeat model for many-to-many relationships

3. **Soft Delete Logic**:
   - Add `isDeleted: false` filter to all Event queries 
   - Update delete operations to set `isDeleted: true` instead of removing records

4. **Event Summary and Analytics**:
   - Use the EventSummary model for quick access to event statistics
   - Use event_sales_summary materialized view for sales analytics

## Example Code Changes

### Before:

```typescript
// Booking service - getting seats
const getBookingSeats = async (bookingId: string) => {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId }
  });
  return booking?.seats ? JSON.parse(booking.seats as string) : [];
};

// Payment session service - adding seats
const addSeatsToSession = async (sessionId: string, seatIds: string[]) => {
  return prisma.paymentSession.update({
    where: { id: sessionId },
    data: {
      seats: {
        connect: seatIds.map(id => ({ id }))
      }
    }
  });
};

// Event service - deleting an event
const deleteEvent = async (eventId: string) => {
  return prisma.event.delete({
    where: { id: eventId }
  });
};

// Checking seat availability
const getAvailableSeats = async (eventId: string) => {
  return prisma.seat.findMany({
    where: { 
      eventId, 
      status: 'available' 
    }
  });
};

// Getting events for display
const getUpcomingEvents = async () => {
  return prisma.event.findMany({
    where: {
      startDate: { gte: new Date() },
      status: 'PUBLISHED'
    },
    orderBy: { startDate: 'asc' },
    take: 10
  });
};
```

### After:

```typescript
// Booking service - getting seats
const getBookingSeats = async (bookingId: string) => {
  const bookedSeats = await prisma.bookedSeat.findMany({
    where: { bookingId },
    include: { seat: true }
  });
  return bookedSeats.map(bs => bs.seat);
};

// Payment session service - adding seats
const addSeatsToSession = async (sessionId: string, seatIds: string[]) => {
  // Create join table records
  const data = seatIds.map(seatId => ({
    paymentSessionId: sessionId,
    seatId
  }));
  
  return prisma.paymentSessionSeat.createMany({
    data,
    skipDuplicates: true
  });
};

// Event service - deleting an event (soft delete)
const deleteEvent = async (eventId: string) => {
  return prisma.event.update({
    where: { id: eventId },
    data: { 
      isDeleted: true,
      deletedAt: new Date()
    }
  });
};

// Checking seat availability - using enum
const getAvailableSeats = async (eventId: string) => {
  return prisma.seat.findMany({
    where: { 
      eventId, 
      status: 'AVAILABLE' // Using the enum value
    }
  });
};

// Getting events for display - with soft delete filter
const getUpcomingEvents = async () => {
  return prisma.event.findMany({
    where: {
      startDate: { gte: new Date() },
      status: 'PUBLISHED',
      isDeleted: false // Filter out deleted events
    },
    orderBy: { startDate: 'asc' },
    take: 10
  });
};

// Using EventSummary for quick stats
const getEventStats = async (eventId: string) => {
  return prisma.eventSummary.findUnique({
    where: { eventId }
  });
};

// Using materialized view for analytics
const getEventSalesAnalytics = async () => {
  // First refresh the view
  await prisma.$executeRaw`REFRESH MATERIALIZED VIEW event_sales_summary`;
  
  // Then query it
  return prisma.$queryRaw`SELECT * FROM event_sales_summary ORDER BY total_revenue DESC`;
};
```

## Step 5: Verify the Migration

Run the following checks to ensure the migration was successful:

```bash
# Check if new tables and views are created
psql -d your_database_name -c "\dt"
psql -d your_database_name -c "\dv"

# Check if triggers are created
psql -d your_database_name -c "\df"

# Run application in test mode
npm run dev

# Test critical flows
npm run test:api
```

## Step 6: Post-Migration Tasks

1. **Update Documentation**: Update API docs to reflect schema changes
2. **Monitor Performance**: Check query performance improvements
3. **Set up Database Maintenance**: 
   - Schedule regular refreshes of materialized views
   - Monitor trigger performance
   - Set up index maintenance

## Rollback Plan

If issues are encountered, use this rollback plan:

```bash
# Restore the database from backup
pg_restore -d your_database_name your_backup_file

# Revert to previous Prisma schema
git checkout HEAD~1 -- prisma/schema.prisma

# Generate Prisma client with old schema
npx prisma generate
```

## Performance Improvements

These schema changes should result in:

- Faster seat lookups (10-100x improvement for complex queries)
- Reduced database load (properly indexed relationships)
- Better data integrity (referential constraints vs. JSON data)
- More efficient queries (proper join tables vs. many-to-many relations)
- Automated maintenance (triggers keeping summaries up to date)
- Enhanced analytics capabilities (materialized views)
- Faster reads for common query patterns (partial and covering indexes)

## Support

For any issues during migration, contact the database team. 