/**
 * Data migration script for schema optimization
 * 
 * This script should be run after applying the schema migrations to:
 * 1. Populate the BookedSeat table from JSON data in Booking.seats
 * 2. Populate PaymentSessionSeat from existing PaymentSession.seats relation
 * 3. Create EventSummary records for all events
 * 
 * Run with: npx ts-node scripts/migrate-data.ts
 */

import prisma from '../src/db/prisma';
import { logger } from '../src/utils/logger';

// Type definitions for raw query results
type BookingWithSeats = {
  id: string;
  seats: any; // Could be string or JSON object
};

type PaymentSessionSeat = {
  payment_session_id: string;
  seat_id: string;
};

async function migrateData() {
  try {
    logger.info('Starting data migration...');

    // 1. Migrate booked seats from JSON to relational model
    await migrateBookedSeats();
    
    // 2. Migrate payment session seats to join table
    await migratePaymentSessionSeats();
    
    // 3. Create event summaries
    await createEventSummaries();
    
    logger.info('Data migration completed successfully');
  } catch (error) {
    logger.error('Error during data migration:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

async function migrateBookedSeats() {
  logger.info('Migrating booked seats from JSON to relational model...');
  
  // Get all bookings with seats JSON data - using $queryRaw to avoid type errors with JSON filter
  const bookings = await prisma.$queryRaw<BookingWithSeats[]>`
    SELECT id, seats 
    FROM bookings 
    WHERE seats IS NOT NULL AND seats::text != 'null'
  `;
  
  logger.info(`Found ${bookings.length} bookings with seats data to migrate`);
  
  // Process each booking
  for (const booking of bookings) {
    try {
      // Parse seats JSON
      const seatsData = booking.seats ? JSON.parse(JSON.stringify(booking.seats)) : [];
      
      if (!Array.isArray(seatsData) || seatsData.length === 0) {
        continue;
      }
      
      // Create BookedSeat records
      for (const seat of seatsData) {
        if (!seat.id) continue;
        
        // Check if seat still exists
        const seatExists = await prisma.seat.findUnique({
          where: { id: seat.id }
        });
        
        if (seatExists) {
          // Use raw query to insert into booked_seats table
          await prisma.$executeRaw`
            INSERT INTO booked_seats (id, booking_id, seat_id, created_at)
            VALUES (gen_random_uuid(), ${booking.id}, ${seat.id}, NOW())
            ON CONFLICT (booking_id, seat_id) DO NOTHING
          `;
        }
      }
      
      logger.info(`Migrated ${seatsData.length} seats for booking ${booking.id}`);
    } catch (error) {
      logger.error(`Error migrating seats for booking ${booking.id}:`, error);
    }
  }
  
  logger.info('Booked seats migration completed');
}

async function migratePaymentSessionSeats() {
  logger.info('Migrating payment session seats to join table...');
  
  // Get all payment sessions with their seats
  const paymentSessions = await prisma.$queryRaw<PaymentSessionSeat[]>`
    SELECT ps.id as payment_session_id, s.id as seat_id
    FROM payment_sessions ps
    JOIN _PaymentSessionToSeat pss ON ps.id = pss."A"
    JOIN seats s ON s.id = pss."B"
  `;
  
  if (!Array.isArray(paymentSessions) || paymentSessions.length === 0) {
    logger.info('No payment session seats to migrate');
    return;
  }
  
  logger.info(`Found ${paymentSessions.length} payment session seats to migrate`);
  
  // Create records in the new join table
  for (const record of paymentSessions) {
    try {
      // Use raw query to insert into payment_session_seats table
      await prisma.$executeRaw`
        INSERT INTO payment_session_seats (id, payment_session_id, seat_id, created_at)
        VALUES (gen_random_uuid(), ${record.payment_session_id}, ${record.seat_id}, NOW())
        ON CONFLICT (payment_session_id, seat_id) DO NOTHING
      `;
    } catch (error) {
      logger.error(`Error migrating payment session seat:`, error);
    }
  }
  
  logger.info('Payment session seats migration completed');
}

async function createEventSummaries() {
  logger.info('Creating event summaries...');
  
  // Get all events
  const events = await prisma.event.findMany({
    select: {
      id: true
    }
  });
  
  logger.info(`Found ${events.length} events to summarize`);
  
  // Create a summary for each event
  for (const event of events) {
    try {
      // Get seat counts and prices
      const seats = await prisma.seat.findMany({
        where: {
          eventId: event.id
        },
        select: {
          id: true,
          price: true,
          status: true
        }
      });
      
      const totalSeats = seats.length;
      const bookedSeats = seats.filter(s => 
        s.status === 'BOOKED' || s.status === 'BLOCKED' || s.status === 'booked' || s.status === 'blocked'
      ).length;
      const availableSeats = totalSeats - bookedSeats;
      
      // Calculate min and max prices
      const prices = seats.map(s => Number(s.price));
      const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
      const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
      
      // Insert or update event summary using raw query
      await prisma.$executeRaw`
        INSERT INTO event_summaries (
          id, event_id, total_seats, booked_seats, available_seats, min_price, max_price, created_at, updated_at
        ) VALUES (
          gen_random_uuid(), ${event.id}, ${totalSeats}, ${bookedSeats}, ${availableSeats}, 
          ${minPrice}, ${maxPrice}, NOW(), NOW()
        )
        ON CONFLICT (event_id) 
        DO UPDATE SET
          total_seats = ${totalSeats},
          booked_seats = ${bookedSeats},
          available_seats = ${availableSeats},
          min_price = ${minPrice},
          max_price = ${maxPrice},
          updated_at = NOW()
      `;
      
      logger.info(`Created summary for event ${event.id}`);
    } catch (error) {
      logger.error(`Error creating summary for event ${event.id}:`, error);
    }
  }
  
  logger.info('Event summaries creation completed');
}

// Run the migration
migrateData(); 