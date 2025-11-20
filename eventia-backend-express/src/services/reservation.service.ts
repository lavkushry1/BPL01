import { BookingStatus, PaymentStatus } from '@prisma/client';
import { ApiError } from '../utils/apiError';
import { prisma } from '../db/prisma';

export const reservationService = {
  /**
   * Create a new reservation (Booking with PENDING status)
   */
  async createReservation(data: {
    userId: string;
    eventId: string;
    tickets: Record<string, number>;
    totalAmount?: number;
  }) {
    try {
      // Calculate total quantity
      const quantity = Object.values(data.tickets).reduce((a, b) => a + b, 0);

      let finalAmount = data.totalAmount;

      // If totalAmount is not provided, calculate it from ticket categories
      if (!finalAmount) {
        finalAmount = 0;
        const categoryIds = Object.keys(data.tickets);

        const categories = await prisma.ticketCategory.findMany({
          where: {
            id: { in: categoryIds },
            eventId: data.eventId
          }
        });

        const categoryMap = new Map(categories.map(c => [c.id, Number(c.price)]));

        for (const [catId, qty] of Object.entries(data.tickets)) {
          const price = categoryMap.get(catId) || 0;
          finalAmount += price * qty;
        }
      }

      // Create the booking
      const booking = await prisma.booking.create({
        data: {
          userId: data.userId,
          eventId: data.eventId,
          quantity: quantity,
          finalAmount: finalAmount || 0,
          status: BookingStatus.PENDING,
          seats: data.tickets, // Storing ticket breakdown in seats JSON for now as per schema
        },
        include: {
          event: true,
          user: true
        }
      });

      // Create a pending payment record
      await prisma.payment.create({
        data: {
          bookingId: booking.id,
          amount: finalAmount || 0,
          status: PaymentStatus.PENDING
        }
      });

      return booking;
    } catch (error) {
      console.error('Error creating reservation:', error);
      throw new ApiError(500, 'Failed to create reservation');
    }
  },

  /**
   * Update reservation
   */
  async updateReservation(id: string, data: { status?: BookingStatus; seats?: any }) {
    try {
      const booking = await prisma.booking.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date()
        },
        include: { payment: true }
      });
      return booking;
    } catch (error) {
      throw new ApiError(500, 'Failed to update reservation');
    }
  },

  /**
   * Update reservation status
   */
  async updateReservationStatus(id: string, status: BookingStatus) {
    return this.updateReservation(id, { status });
  },

  /**
   * Get reservation by ID
   */
  async getReservationById(id: string) {
    try {
      const booking = await prisma.booking.findUnique({
        where: { id },
        include: {
          event: true,
          user: true,
          payment: true,
          bookingPayment: true
        }
      });

      if (!booking) {
        throw new ApiError(404, 'Reservation not found');
      }

      return booking;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Failed to fetch reservation');
    }
  },

  /**
   * Get reservations by Event ID
   */
  async getReservationsByEventId(eventId: string) {
    try {
      return await prisma.booking.findMany({
        where: { eventId },
        include: {
          user: {
            select: {
              name: true,
              email: true
            }
          }
        }
      });
    } catch (error) {
      throw new ApiError(500, 'Failed to fetch event reservations');
    }
  }
};
