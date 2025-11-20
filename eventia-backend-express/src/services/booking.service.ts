/**
 * @service BookingService
 * @description Provides methods for managing bookings and delivery details in the Eventia system.
 * This service acts as an interface between the frontend components and the Express backend API,
 * handling all booking-related operations including creation, retrieval, and status updates.
 * 
 * @dataFlow
 * - Used by EventDetail page to create bookings when users select tickets
 * - Used by BookingConfirmation page to display booking details
 * - Used by BookingHistory page to display user's past bookings
 * - Integrated with PaymentApi for handling payment status updates
 * 
 * @backendModels
 * Maps to:
 * - 'bookings' table in database (id, user_id, event_id, ticket_type, quantity, status, etc.)
 * - 'delivery_details' table in database (id, booking_id, address, city, postal_code, etc.)
 * 
 * @statusFlow
 * Booking Status: 'pending' → 'payment_initiated' → 'payment_completed' → 'confirmed' → 'delivered'
 */

import type { PrismaClient } from '@prisma/client';
import { Booking, DeliveryDetails } from '../models';
import { db } from '../db';
import { prisma } from '../db/prisma';
import { ApiError } from '../utils/apiError';
import { v4 as uuidv4 } from 'uuid';
import * as ticketService from './ticket.service';

export const bookingService = {
  /**
   * Create a new booking in the system
   * @param booking - The booking data to insert, excluding auto-generated fields
   * @returns The newly created booking with all fields
   * @throws Error if the API operation fails
   */
  async createBooking(booking: any) {
    try {
      const { event_id, quantity, discount_code, user_id } = booking;

      // Validate event exists
      const event = await db('events').where({ id: event_id }).first();
      if (!event) {
        throw new ApiError(404, 'Event not found');
      }

      // Create the booking
      const [createdBooking] = await db('bookings').insert({
        user_id,
        event_id,
        quantity,
        discount_code,
        status: 'PENDING',
        created_at: new Date()
      }).returning('*');

      return createdBooking as Booking;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Retrieve a booking by its unique identifier
   * @param id - The booking's unique identifier
   * @returns The booking data if found
   * @throws Error if the booking is not found or operation fails
   */
  async getBookingById(id: string) {
    try {
      const booking = await db('bookings')
        .where({ id })
        .first();

      if (!booking) {
        throw new ApiError(404, 'Booking not found');
      }

      // Get delivery details if available
      const deliveryDetails = await db('delivery_details')
        .where({ booking_id: id })
        .first();

      return {
        ...booking,
        deliveryDetails: deliveryDetails || null
      } as Booking;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get all bookings for a specific user
   * @param userId - The user's unique identifier
   * @returns Array of bookings belonging to the user, sorted by creation date
   * @throws Error if the API operation fails
   */
  async getBookingsByUserId(userId: string) {
    try {
      const bookings = await db('bookings')
        .where({ user_id: userId })
        .orderBy('created_at', 'desc');

      return bookings as Booking[];
    } catch (error) {
      throw error;
    }
  },

  /**
   * Update the status of an existing booking
   * @param id - The booking's unique identifier
   * @param status - The new status to set
   * @returns The updated booking data
   * @throws Error if the booking is not found or operation fails
   */
  async updateBookingStatus(id: string, status: Booking['status']) {
    try {
      const [updatedBooking] = await db('bookings')
        .where({ id })
        .update({
          status,
          updated_at: new Date()
        })
        .returning('*');

      if (!updatedBooking) {
        throw new ApiError(404, 'Booking not found');
      }

      return updatedBooking as Booking;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Add delivery details for a booking
   * @param deliveryDetails - The delivery information to associate with a booking
   * @returns The created delivery details record
   * @throws Error if the API operation fails
   */
  async addDeliveryDetails(deliveryDetails: any) {
    try {
      const { booking_id, name, email, phone, address, city, pincode } = deliveryDetails;

      // Check if booking exists
      const booking = await db('bookings').where({ id: booking_id }).first();
      if (!booking) {
        throw new ApiError(404, 'Booking not found');
      }

      // Check if delivery details already exist
      const existingDetails = await db('delivery_details')
        .where({ booking_id })
        .first();

      if (existingDetails) {
        // Update existing details
        const [updatedDetails] = await db('delivery_details')
          .where({ booking_id })
          .update({
            name,
            email,
            phone,
            address,
            city,
            pincode,
            updated_at: new Date()
          })
          .returning('*');

        return updatedDetails as DeliveryDetails;
      } else {
        // Create new delivery details
        const [createdDetails] = await db('delivery_details')
          .insert({
            booking_id,
            name,
            email,
            phone,
            address,
            city,
            pincode,
            created_at: new Date()
          })
          .returning('*');

        return createdDetails as DeliveryDetails;
      }
    } catch (error) {
      throw error;
    }
  },

  /**
   * Retrieve delivery details for a specific booking
   * @param bookingId - The booking's unique identifier
   * @returns The delivery details if found
   * @throws Error if no delivery details exist or operation fails
   */
  async getDeliveryDetailsByBookingId(bookingId: string) {
    try {
      const deliveryDetails = await db('delivery_details')
        .where({ booking_id: bookingId })
        .first();

      if (!deliveryDetails) {
        throw new ApiError(404, 'No delivery details found for this booking');
      }

      return deliveryDetails as DeliveryDetails;
    } catch (error) {
      throw error;
    }
  }
};

/**
 * Creates a booking from a payment intent
 * @param prisma Prisma client instance
 * @param paymentIntentId Payment intent ID
 */
/*
export const createBookingFromPaymentIntent = async (prisma: PrismaClient, paymentIntentId: string) => {
  try {
    // Get the payment intent with seats
    const paymentIntent = await prisma.paymentIntent.findUnique({
      where: { id: paymentIntentId },
      include: {
        seats: {
          include: {
            category: true
          }
        }
      }
    });

    if (!paymentIntent) {
      throw new Error(`Payment intent ${paymentIntentId} not found`);
    }

    // Create booking reference
    const bookingReference = `BK-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        reference: bookingReference,
        userId: paymentIntent.userId,
        eventId: paymentIntent.eventId,
        totalAmount: paymentIntent.amount,
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
        paymentMethod: 'UPI',
        paymentIntentId: paymentIntent.id,
        seats: {
          connect: paymentIntent.seats.map(seat => ({ id: seat.id }))
        }
      }
    });

    // Generate tickets for the booking
    await ticketService.generateTicketsForBooking(prisma, booking.id, paymentIntent.seats);

    return booking;
  } catch (error) {
    console.error('Error creating booking from payment intent:', error);
    throw error;
  }
};
*/

/**
 * Gets a booking by ID
 * @param bookingId Booking ID
 * @returns Booking with related data
 */
export const getBookingById = async (bookingId: string) => {
  try {
    // Using "any" type to bypass type checking limitations in our current schema
    const booking = await (prisma as any).booking.findUnique({
      where: { id: bookingId },
      include: {
        event: true,
        deliveryDetails: true
      }
    });

    return booking;
  } catch (error) {
    console.error(`Error getting booking ${bookingId}:`, error);
    throw error;
  }
};

/**
 * Create a booking from a payment session
 * @param prisma Prisma client or transaction context
 * @param sessionId Payment session ID
 * @returns The created booking
 */
export const createBookingFromPaymentSession = async (prisma: any, sessionId: string) => {
  const paymentSession = await prisma.paymentSession.findUnique({
    where: { id: sessionId },
    include: { seats: true }
  });

  if (!paymentSession) {
    throw new Error(`Payment session with ID ${sessionId} not found`);
  }

  // Create booking
  const booking = await prisma.booking.create({
    data: {
      userId: paymentSession.userId,
      eventId: paymentSession.eventId,
      status: 'CONFIRMED',
      quantity: paymentSession.seats.length,
      finalAmount: paymentSession.amount,
      // Store seat data as JSON since we don't have a direct relation
      seats: JSON.stringify(paymentSession.seats.map((seat: any) => ({
        id: seat.id,
        section: seat.section,
        row: seat.row,
        seatNumber: seat.seatNumber,
        price: seat.price
      }))),
      paymentSession: {
        connect: { id: paymentSession.id }
      }
    }
  });

  // Update payment session status
  await prisma.paymentSession.update({
    where: { id: sessionId },
    data: {
      status: 'COMPLETED'
    }
  });

  return booking;
};
