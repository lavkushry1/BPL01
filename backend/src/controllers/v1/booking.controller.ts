import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../../utils/apiResponse';
import { ApiError } from '../../utils/apiError';
import { asyncHandler } from '../../utils/asyncHandler';
import { logger } from '../../utils/logger';
import { prisma } from '../../db/prisma';
import { ErrorCode } from '../../utils/errorCodes';
import { BookingStatus, PaymentStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Controller for handling booking operations in the v1 API
 * This controller uses the standardized patterns with proper error handling
 */
export class BookingControllerV1 {
  /**
   * Create a new booking
   */
  static createBooking = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { eventId, seatIds, paymentMethod } = req.body;
    const userId = req.user?.id;
    
    if (!userId) {
      throw new ApiError(401, 'Not authenticated', ErrorCode.NOT_AUTHENTICATED);
    }
    
    // Validate required fields
    if (!eventId || !seatIds || !seatIds.length) {
      throw new ApiError(400, 'Event ID and at least one seat ID are required', ErrorCode.MISSING_REQUIRED_FIELDS);
    }
    
    // Verify event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        ticketCategories: true
      }
    });
    
    if (!event) {
      throw new ApiError(404, 'Event not found', ErrorCode.EVENT_NOT_FOUND);
    }
    
    // Verify seats exist and are available
    const seats = await prisma.seat.findMany({
      where: {
        id: { in: seatIds },
        eventId,
        status: 'AVAILABLE'
      }
    });
    
    if (seats.length !== seatIds.length) {
      throw new ApiError(400, 'One or more seats are unavailable', ErrorCode.SEATS_UNAVAILABLE);
    }
    
    // Calculate total price
    const totalPrice = seats.reduce((sum, seat) => sum + Number(seat.price), 0);
    
    // Create booking and tickets in a transaction
    const booking = await prisma.$transaction(async (prismaClient) => {
      // Create booking
      const newBooking = await prismaClient.booking.create({
        data: {
          userId,
          eventId,
          finalAmount: totalPrice,
          status: BookingStatus.PENDING,
          // Store the booked seats as JSON
          seats: JSON.stringify(seatIds)
        }
      });
      
      // Create payment record
      await prismaClient.payment.create({
        data: {
          bookingId: newBooking.id,
          amount: totalPrice,
          status: PaymentStatus.PENDING,
          method: paymentMethod || 'UNKNOWN'
        }
      });
      
      // Create tickets for each seat
      const ticketPromises = seats.map(seat => 
        prismaClient.ticket.create({
          data: {
            userId,
            eventId,
            bookingId: newBooking.id,
            seatId: seat.id,
            ticketNumber: `TKT-${Math.floor(Math.random() * 1000000)}`,
            status: 'ACTIVE'
          }
        })
      );
      
      await Promise.all(ticketPromises);
      
      // Update seat status
      await prismaClient.seat.updateMany({
        where: { id: { in: seatIds } },
        data: { status: 'RESERVED' }
      });
      
      return newBooking;
    });
    
    // Get the created booking with relationships
    const bookingResult = await getBookingWithRelationships(booking.id);
    
    return ApiResponse.created(res, bookingResult, 'Booking created successfully');
  });
  
  /**
   * Get user's bookings
   */
  static getUserBookings = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id;
    
    if (!userId) {
      throw new ApiError(401, 'Not authenticated', ErrorCode.NOT_AUTHENTICATED);
    }
    
    const { page = 1, limit = 10, status } = req.query;
    
    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);
    
    // Build query conditions
    const where: any = { userId };
    
    if (status) {
      where.status = status.toString();
    }
    
    // Execute query - we need to do separate queries for bookings and tickets
    const bookings = await prisma.booking.findMany({
      where,
      include: {
        event: {
          select: {
            id: true,
            title: true,
            startDate: true,
            location: true
          }
        },
        payment: true
      },
      skip,
      take,
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    // Get tickets for these bookings
    const bookingIds = bookings.map(b => b.id);
    const tickets = await prisma.ticket.findMany({
      where: {
        bookingId: { in: bookingIds }
      },
      include: {
        seat: true
      }
    });
    
    // Group tickets by booking ID
    const ticketsByBookingId = tickets.reduce((acc, ticket) => {
      if (!acc[ticket.bookingId]) {
        acc[ticket.bookingId] = [];
      }
      acc[ticket.bookingId].push(ticket);
      return acc;
    }, {} as Record<string, typeof tickets>);
    
    // Add tickets to bookings
    const bookingsWithTickets = bookings.map(booking => ({
      ...booking,
      tickets: ticketsByBookingId[booking.id] || []
    }));
    
    // Get total count for pagination
    const total = await prisma.booking.count({ where });
    
    return ApiResponse.success(res, {
      bookings: bookingsWithTickets,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
      }
    }, 'User bookings fetched successfully');
  });
  
  /**
   * Get booking by ID
   */
  static getBookingById = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const userId = req.user?.id;
    
    if (!userId) {
      throw new ApiError(401, 'Not authenticated', ErrorCode.NOT_AUTHENTICATED);
    }
    
    const booking = await getBookingWithRelationships(id);
    
    if (!booking) {
      throw new ApiError(404, 'Booking not found', ErrorCode.BOOKING_NOT_FOUND);
    }
    
    // User can only access their own bookings unless they're an admin
    if (booking.userId !== userId && req.user.role !== 'ADMIN') {
      throw new ApiError(403, 'Forbidden', ErrorCode.FORBIDDEN);
    }
    
    return ApiResponse.success(res, booking, 'Booking fetched successfully');
  });
  
  /**
   * Cancel booking
   */
  static cancelBooking = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const userId = req.user?.id;
    
    if (!userId) {
      throw new ApiError(401, 'Not authenticated', ErrorCode.NOT_AUTHENTICATED);
    }
    
    // First get the booking to check permissions and status
    const booking = await prisma.booking.findUnique({
      where: { id }
    });
    
    if (!booking) {
      throw new ApiError(404, 'Booking not found', ErrorCode.BOOKING_NOT_FOUND);
    }
    
    // User can only cancel their own bookings unless they're an admin
    if (booking.userId !== userId && req.user.role !== 'ADMIN') {
      throw new ApiError(403, 'Forbidden', ErrorCode.FORBIDDEN);
    }
    
    // Check if booking is already cancelled
    if (booking.status === BookingStatus.CANCELLED) {
      throw new ApiError(400, 'Booking is already cancelled', ErrorCode.BOOKING_ALREADY_CANCELLED);
    }
    
    // Check if booking can be cancelled
    if (booking.status !== BookingStatus.PENDING && booking.status !== BookingStatus.CONFIRMED) {
      throw new ApiError(400, 'Cannot cancel booking in current state', ErrorCode.CANNOT_CANCEL_BOOKING);
    }
    
    // Get tickets for the booking to find seat IDs
    const tickets = await prisma.ticket.findMany({
      where: { bookingId: id }
    });
    
    // Get seat IDs from tickets
    const seatIds = tickets
      .map(ticket => ticket.seatId)
      .filter(Boolean) as string[];
    
    // Update booking, tickets, and seats in a transaction
    await prisma.$transaction([
      // Update booking status
      prisma.booking.update({
        where: { id },
        data: { status: BookingStatus.CANCELLED }
      }),
      
      // Update ticket status
      prisma.ticket.updateMany({
        where: { bookingId: id },
        data: { status: 'CANCELLED' }
      }),
      
      // Make seats available again if there are any
      ...(seatIds.length > 0 ? [
        prisma.seat.updateMany({
          where: { id: { in: seatIds } },
          data: { status: 'AVAILABLE' }
        })
      ] : [])
    ]);
    
    return ApiResponse.success(res, { id }, 'Booking cancelled successfully');
  });
  
  /**
   * Get all bookings (Admin only)
   */
  static getAllBookings = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    // Check if admin
    if (req.user?.role !== 'ADMIN') {
      throw new ApiError(403, 'Forbidden', ErrorCode.FORBIDDEN);
    }
    
    const { page = 1, limit = 10, status, eventId, userId } = req.query;
    
    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);
    
    // Build query conditions
    const where: any = {};
    
    if (status) {
      where.status = status.toString();
    }
    
    if (eventId) {
      where.eventId = eventId.toString();
    }
    
    if (userId) {
      where.userId = userId.toString();
    }
    
    // Execute query
    const bookings = await prisma.booking.findMany({
      where,
      include: {
        event: {
          select: {
            id: true,
            title: true,
            startDate: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        payment: true
      },
      skip,
      take,
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    // Get total count for pagination
    const total = await prisma.booking.count({ where });
    
    return ApiResponse.success(res, {
      bookings,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
      }
    }, 'Bookings fetched successfully');
  });
  
  /**
   * Update booking status (Admin only)
   */
  static updateBookingStatus = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    // Check if admin
    if (req.user?.role !== 'ADMIN') {
      throw new ApiError(403, 'Forbidden', ErrorCode.FORBIDDEN);
    }
    
    const { id } = req.params;
    const { status, paymentStatus } = req.body;
    
    // Validate required fields
    if (!status && !paymentStatus) {
      throw new ApiError(400, 'Status or payment status is required', ErrorCode.MISSING_REQUIRED_FIELDS);
    }
    
    // First check if booking exists
    const booking = await prisma.booking.findUnique({
      where: { id }
    });
    
    if (!booking) {
      throw new ApiError(404, 'Booking not found', ErrorCode.BOOKING_NOT_FOUND);
    }
    
    // Prepare update data for booking
    const updateData: any = {};
    
    if (status) {
      updateData.status = status;
    }
    
    // Prepare transaction operations
    const operations = [];
    
    // Add booking update operation
    operations.push(
      prisma.booking.update({
        where: { id },
        data: updateData
      })
    );
    
    // Add payment update operation if needed
    if (paymentStatus) {
      const payment = await prisma.payment.findUnique({
        where: { bookingId: id }
      });
      
      if (payment) {
        operations.push(
          prisma.payment.update({
            where: { bookingId: id },
            data: { status: paymentStatus as PaymentStatus }
          })
        );
      }
    }
    
    // If status changed to CONFIRMED or CANCELLED, update tickets and seats
    if (status === BookingStatus.CONFIRMED || status === BookingStatus.CANCELLED) {
      const ticketStatus = status === BookingStatus.CONFIRMED ? 'ACTIVE' : 'CANCELLED';
      const seatStatus = status === BookingStatus.CONFIRMED ? 'BOOKED' : 'AVAILABLE';
      
      // Get tickets for this booking
      const tickets = await prisma.ticket.findMany({
        where: { bookingId: id }
      });
      
      // Update tickets status
      operations.push(
        prisma.ticket.updateMany({
          where: { bookingId: id },
          data: { status: ticketStatus }
        })
      );
      
      // Get seat IDs from tickets
      const seatIds = tickets
        .map(ticket => ticket.seatId)
        .filter(Boolean) as string[];
      
      // Update seat status if there are any seats
      if (seatIds.length > 0) {
        operations.push(
          prisma.seat.updateMany({
            where: { id: { in: seatIds } },
            data: { status: seatStatus }
          })
        );
      }
    }
    
    // Execute transaction
    await prisma.$transaction(operations);
    
    // Get updated booking with relationships
    const updatedBooking = await getBookingWithRelationships(id);
    
    return ApiResponse.success(res, updatedBooking, 'Booking status updated successfully');
  });
}

/**
 * Helper function to get a booking with all its relationships
 */
async function getBookingWithRelationships(id: string) {
  // Get the booking
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      event: {
        select: {
          id: true,
          title: true,
          startDate: true,
          location: true
        }
      },
      payment: true
    }
  });
  
  if (!booking) return null;
  
  // Get tickets separately
  const tickets = await prisma.ticket.findMany({
    where: { bookingId: id },
    include: {
      seat: true
    }
  });
  
  // Combine the data
  return {
    ...booking,
    tickets
  };
} 