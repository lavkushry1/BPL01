
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { SeatStatus } from '../models/seat';
import { WebsocketService } from '../services/websocket.service';
import { ApiError } from '../utils/apiError';
import { ApiResponse } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { cancelBookingSchema, createBookingSchema, saveDeliveryDetailsSchema, updateBookingStatusSchema } from '../validations/booking.validation';

/**
 * Create a new booking
 */
export const createBooking = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { body: validatedData } = createBookingSchema.parse({ body: req.body });
    const { event_id, seat_ids, amount } = validatedData;
    let user_id = req.user?.id;
    const { guest_name, guest_email, guest_phone } = validatedData;

    // Handle Guest User Creation or Lookup
    if (!user_id) {
      if (!guest_email || !guest_name || !guest_phone) {
        throw ApiError.badRequest('Guest details (name, email, phone) are required for unauthenticated bookings');
      }

      // Check if user exists with this email
      const existingUser = await db('users').where('email', guest_email).first();

      if (existingUser) {
        user_id = existingUser.id;
      } else {
        // Create new guest user
        const newUserId = uuidv4();
        // Generate a random strong password for the guest account
        const randomPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8); // simple random string
        const bcrypt = await import('bcryptjs');
        const hashedPassword = await bcrypt.hash(randomPassword, 10);

        await db('users').insert({
          id: newUserId,
          name: guest_name,
          email: guest_email,
          password: hashedPassword,
          // Keep schema-compatible role; the database enum is UserRole(USER|ORGANIZER|ADMIN)
          role: 'USER',
          createdAt: db.fn.now(),
          updatedAt: db.fn.now()
        });
        user_id = newUserId;
      }
    }

    // Process booking with transaction to ensure data integrity
    const newBooking = await db.transaction(async trx => {
      // 1. Check if event exists
      const event = await trx('events')
        .select('id')
        .where('id', event_id)
        .forUpdate() // Lock the event row
        .first();

      if (!event) {
        throw ApiError.notFound('Event not found');
      }

      // 2. Create booking record
      const booking_id = uuidv4();
      const [booking] = await trx('bookings')
        .insert({
          id: booking_id,
          event_id,
          user_id,
          final_amount: amount,
          status: 'PENDING',
          createdAt: trx.fn.now(),
          updatedAt: trx.fn.now()
        })
        .returning('*');

      const allBookedSeatIds: string[] = [];

      // 4a. Handle Specific Seat Selection
      if (seat_ids && seat_ids.length > 0) {
        // Pessimistically lock requested seats to prevent double booking
        const seats = await trx('seats')
          .whereIn('id', seat_ids)
          .forUpdate()
          .select('id', 'status');

        if (seats.length !== seat_ids.length) {
          throw ApiError.badRequest('One or more seats were not found');
        }

        const unavailableSeats = seats.filter(seat => seat.status !== SeatStatus.AVAILABLE);
        if (unavailableSeats.length > 0) {
          throw ApiError.conflict(
            'One or more seats are no longer available',
            'SEAT_NOT_AVAILABLE',
            { unavailableSeats: unavailableSeats.map(s => s.id) }
          );
        }

        // Update seat status to booked
        await trx('seats')
          .update({
            status: SeatStatus.BOOKED,
            booking_id: booking_id,
            updatedAt: trx.fn.now()
          })
          .whereIn('id', seat_ids);

        allBookedSeatIds.push(...seat_ids);
      }

      // 4b. Handle General Admission / Section Booking (Tickets Array)
      if (validatedData.tickets && validatedData.tickets.length > 0) {
        // Import SeatService here to avoid circular dependencies if any
        const { SeatService } = await import('../services/seat.service');

        for (const ticket of validatedData.tickets) {
          const bookedIds = await SeatService.bookSeatsBySection(
            trx,
            event_id,
            ticket.categoryId,
            ticket.quantity,
            booking_id
          );
          allBookedSeatIds.push(...bookedIds);
        }
      }

      if (allBookedSeatIds.length > 0) {
        // Notify other clients that seats have been booked
        WebsocketService.notifySeatStatusChange(
          allBookedSeatIds,
          SeatStatus.BOOKED
        );
      }

      return booking;
    });

    return ApiResponse.created(res, newBooking, 'Booking created successfully');
  } catch (error) {
    console.error('CRITICAL DEBUG - createBooking error:', error);
    throw error;
  }
});

/**
 * Get all bookings for the authenticated user
 */
export const getUserBookings = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
      throw ApiError.unauthorized('User not authenticated');
    }

    const bookings = await db('bookings')
      .select(
        'id',
        'event_id',
        'user_id',
        'status',
        'createdAt',
        'updatedAt'
      )
      .where('user_id', userId)
      .orderBy('createdAt', 'desc');

  return ApiResponse.success(res, 200, 'Bookings fetched successfully', bookings);
});

/**
 * Get booking by ID
 */
export const getBookingById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  // Get booking details
  const booking = await db('bookings')
    .select(
      'id',
      'event_id',
      'user_id',
      'status',
      'createdAt',
      'updatedAt'
    )
    .where('id', id)
    .first();

  if (!booking) {
    throw ApiError.notFound('Booking not found');
  }

  // User can only view their own bookings unless they're an admin
  const userId = req.user?.id;
  if (booking.user_id !== userId && req.user?.role !== 'ADMIN') {
    throw ApiError.forbidden('You are not authorized to view this booking');
  }

  return ApiResponse.success(res, 200, 'Booking fetched successfully', booking);
});

/**
 * Save delivery details
 */
export const saveDeliveryDetails = asyncHandler(async (req: Request, res: Response) => {
  const { body: validatedData } = saveDeliveryDetailsSchema.parse({ body: req.body });
  const { booking_id, name, phone, address, city, pincode } = validatedData;

  // Check if booking exists
  const booking = await db('bookings')
    .select('id')
    .where('id', booking_id)
    .first();

  if (!booking) {
    throw ApiError.notFound('Booking not found');
  }

  // Use transaction to ensure atomicity
  const [deliveryDetails] = await db.transaction(async trx => {
    // Check if delivery details already exist
    const existingDetails = await trx('delivery_details')
      .where('booking_id', booking_id)
      .first();

    if (existingDetails) {
      // Update existing details
      return await trx('delivery_details')
        .where('booking_id', booking_id)
        .update({
          name,
          phone,
          address,
          city,
          pincode,
          updatedAt: trx.fn.now()
        })
        .returning('*');
    } else {
      // Create new delivery details
      return await trx('delivery_details')
        .insert({
          id: uuidv4(),
          booking_id,
          name,
          phone,
          address,
          city,
          pincode,
          createdAt: trx.fn.now(),
          updatedAt: trx.fn.now()
        })
        .returning('*');
    }
  });

  return ApiResponse.created(res, deliveryDetails, 'Delivery details saved successfully');
});

/**
 * Update booking status
 */
export const updateBookingStatus = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { body: { status } } = updateBookingStatusSchema.parse({ params: req.params, body: req.body });

  // Check if booking exists
  const booking = await db('bookings')
    .select('id')
    .where('id', id)
    .first();

  if (!booking) {
    throw ApiError.notFound('Booking not found');
  }

  // Update booking status
  const [updatedBooking] = await db('bookings')
    .where('id', id)
    .update({
      status,
      updatedAt: db.fn.now()
    })
    .returning('*');

  return ApiResponse.success(res, 200, 'Booking status updated successfully', updatedBooking);
});

/**
 * Cancel booking
 */
export const cancelBooking = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  cancelBookingSchema.parse({ params: req.params, body: req.body });

  // Check if booking exists
  const booking = await db('bookings')
    .select('*')
    .where('id', id)
    .first();

  if (!booking) {
    throw ApiError.notFound('Booking not found', 'BOOKING_NOT_FOUND');
  }

  // User can only cancel their own bookings unless they're an admin
  const userId = req.user?.id;
  if (booking.user_id !== userId && req.user?.role !== 'ADMIN') {
    throw ApiError.forbidden('You are not authorized to cancel this booking');
  }

  // Validate cancellation is allowed
  if (booking.status === 'CANCELLED') {
    throw ApiError.badRequest('Booking already cancelled', 'ALREADY_CANCELLED');
  }

  // Check if event date is within cancellation period
  // This would need to be adapted based on your schema
  let eventCanBeCancelled = true;
  if (booking.event_id) {
    const event = await db('events')
      .select('start_date')
      .where('id', booking.event_id)
      .first();

    if (event && event.start_date) {
      const now = new Date();
      const eventDate = new Date(event.start_date);
      const hoursTillEvent = (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60);

      if (hoursTillEvent < 24) {
        eventCanBeCancelled = false;
      }
    }
  }

  if (!eventCanBeCancelled) {
    throw new ApiError(400, 'Cannot cancel bookings less than 24 hours before event', 'CANCELLATION_PERIOD_EXPIRED');
  }

  // Use transaction for all related updates
  const result = await db.transaction(async trx => {
    // Update booking status
    const [cancelledBooking] = await trx('bookings')
      .where('id', id)
      .update({
        status: 'CANCELLED',
        updatedAt: trx.fn.now()
      })
      .returning('*');

    // Get booked seats from seats table directly
    const bookedSeats = await trx('seats')
      .select('id as seat_id')
      .where('booking_id', id);

    const seatIds = bookedSeats.map((bs: any) => bs.seat_id);

    if (seatIds.length > 0) {
      // Release seats
      await trx('seats')
        .whereIn('id', seatIds)
        .update({
          status: 'AVAILABLE',
          updatedAt: trx.fn.now()
        });
    }

    // Check for payment associated with this booking
    const payment = await trx('booking_payments')
      .select('id', 'status')
      .where('booking_id', id)
      .first();

    // If payment exists and was verified, mark for refund
    let paymentRefunded = false;
    if (payment && payment.status === 'verified') {
      await trx('booking_payments')
        .where('id', payment.id)
        .update({
          status: 'refunded',
          updatedAt: trx.fn.now()
        })
        .returning('*');
      paymentRefunded = true;
    }


    return {
      cancelledBooking,
      paymentRefunded
    };
  });

  // Notify through WebSocket if available
  try {
    WebsocketService.notifyBookingUpdate(id, 'cancelled');
  } catch (error) {
    // Ignore websocket errors during cancellation
    console.error('Websocket notification failed:', error);
  }

  return ApiResponse.success(res, 200, 'Booking cancelled successfully', {
    booking_id: result.cancelledBooking.id,
    status: result.cancelledBooking.status,
    cancelled_at: result.cancelledBooking.cancelled_at,
    refund_status: result.paymentRefunded ? 'initiated' : 'not_applicable'
  });
});
