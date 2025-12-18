/**
 * IPL Booking Service
 * Handles booking creation for IPL matches, managing seats, tickets, and payments
 */

import { BookingStatus, PrismaClient, SeatStatus, TicketStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

export interface IplBookingInput {
  matchId: string;
  eventId: string;
  categoryId: string;
  quantity: number;
  userId?: string;
  guestDetails?: {
    name: string;
    email: string;
    phone: string;
  };
}

export interface IplBookingResult {
  bookingId: string;
  bookingStatus: BookingStatus;
  tickets: Array<{
    ticketCode: string;
    category: string;
    price: number;
  }>;
  totalAmount: number;
  eventDetails: {
    title: string;
    date: string;
    venue: string;
  };
}

export class IplBookingService {
  /**
   * Create a booking for an IPL match
   */
  static async createBooking(input: IplBookingInput): Promise<IplBookingResult> {
    const { matchId, eventId, categoryId, quantity, userId, guestDetails } = input;

    return prisma.$transaction(async (tx) => {
      // 1. Get or create user
      let bookingUserId = userId;

      if (!bookingUserId && guestDetails) {
        // Check if user exists
        const existingUser = await tx.user.findUnique({
          where: { email: guestDetails.email }
        });

        if (existingUser) {
          bookingUserId = existingUser.id;
        } else {
          // Create guest user
          const randomPassword = Math.random().toString(36).slice(-16);
          const hashedPassword = await bcrypt.hash(randomPassword, 10);

          const newUser = await tx.user.create({
            data: {
              id: uuidv4(),
              email: guestDetails.email,
              name: guestDetails.name,
              password: hashedPassword,
              role: 'USER',
              verified: false,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          });
          bookingUserId = newUser.id;
        }
      }

      if (!bookingUserId) {
        throw new Error('User ID or guest details required for booking');
      }

      // 2. Get ticket category and event details
      const category = await tx.ticketCategory.findUnique({
        where: { id: categoryId },
        include: {
          event: {
            include: {
              iplMatch: {
                include: {
                  venue: true,
                  homeTeam: true,
                  awayTeam: true
                }
              }
            }
          }
        }
      });

      if (!category || !category.event) {
        throw new Error('Invalid ticket category or event not found');
      }

      const price = Number(category.price);
      const totalAmount = price * quantity;

      // 3. Check availability
      const available = category.available ?? (category.totalSeats - category.bookedSeats);
      if (available < quantity) {
        throw new Error(`Only ${available} tickets available`);
      }

      // 4. Get available seats for this category
      const availableSeats = await tx.seat.findMany({
        where: {
          eventId: eventId,
          ticketCategoryId: categoryId,
          status: SeatStatus.AVAILABLE
        },
        take: quantity
      });

      // 5. Create booking
      const bookingId = uuidv4();
      const booking = await tx.booking.create({
        data: {
          id: bookingId,
          userId: bookingUserId,
          eventId: eventId,
          status: BookingStatus.PENDING,
          quantity: quantity,
          finalAmount: totalAmount,
          seats: JSON.stringify(availableSeats.map(s => s.id)),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      // 6. Update seats to BOOKED and create booked_seats entries
      if (availableSeats.length > 0) {
        await tx.seat.updateMany({
          where: {
            id: { in: availableSeats.map(s => s.id) }
          },
          data: {
            status: SeatStatus.BOOKED,
            updatedAt: new Date()
          }
        });

        // Create bookedSeat records
        await tx.bookedSeat.createMany({
          data: availableSeats.map(seat => ({
            id: uuidv4(),
            bookingId: bookingId,
            seatId: seat.id,
            createdAt: new Date()
          }))
        });
      }

      // 7. Create tickets
      const tickets: Array<{ ticketCode: string; category: string; price: number }> = [];

      for (let i = 0; i < quantity; i++) {
        const ticketCode = `IPL-${matchId.substring(0, 6).toUpperCase()}-${Date.now().toString(36).toUpperCase()}-${i + 1}`;

        await tx.ticket.create({
          data: {
            id: uuidv4(),
            code: ticketCode,
            status: TicketStatus.PENDING,
            bookingId: bookingId,
            eventId: eventId,
            ticketCategoryId: categoryId,
            seatId: availableSeats[i]?.id || null,
            userId: bookingUserId,
            price: price,
            firstName: guestDetails?.name?.split(' ')[0] || null,
            lastName: guestDetails?.name?.split(' ').slice(1).join(' ') || null,
            email: guestDetails?.email || null,
            phone: guestDetails?.phone || null,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });

        tickets.push({
          ticketCode,
          category: category.name,
          price
        });
      }

      // 8. Update ticket category availability
      await tx.ticketCategory.update({
        where: { id: categoryId },
        data: {
          bookedSeats: { increment: quantity },
          available: { decrement: quantity },
          updatedAt: new Date()
        }
      });

      // 9. Update event summary
      await tx.eventSummary.updateMany({
        where: { eventId: eventId },
        data: {
          bookedSeats: { increment: quantity },
          availableSeats: { decrement: quantity },
          updatedAt: new Date()
        }
      });

      // Build event details
      const match = category.event.iplMatch;
      const eventDetails = {
        title: match ? `${match.homeTeam.name} vs ${match.awayTeam.name}` : category.event.title,
        date: match?.matchDate?.toISOString() || category.event.startDate.toISOString(),
        venue: match?.venue?.name || category.event.location
      };

      return {
        bookingId: booking.id,
        bookingStatus: booking.status,
        tickets,
        totalAmount,
        eventDetails
      };
    });
  }

  /**
   * Confirm a booking after payment
   */
  static async confirmBooking(bookingId: string): Promise<void> {
    await prisma.$transaction(async (tx) => {
      // Update booking status
      await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: BookingStatus.CONFIRMED,
          updatedAt: new Date()
        }
      });

      // Update tickets to ACTIVE
      await tx.ticket.updateMany({
        where: { bookingId: bookingId },
        data: {
          status: TicketStatus.ACTIVE,
          updatedAt: new Date()
        }
      });
    });
  }

  /**
   * Cancel a booking
   */
  static async cancelBooking(bookingId: string): Promise<void> {
    await prisma.$transaction(async (tx) => {
      // Get booking with related data
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
        include: {
          tickets: true,
          bookedSeats: true
        }
      });

      if (!booking) {
        throw new Error('Booking not found');
      }

      // Update booking status
      await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: BookingStatus.CANCELLED,
          updatedAt: new Date()
        }
      });

      // Release seats
      const seatIds = booking.bookedSeats.map(bs => bs.seatId);
      if (seatIds.length > 0) {
        await tx.seat.updateMany({
          where: { id: { in: seatIds } },
          data: {
            status: SeatStatus.AVAILABLE,
            updatedAt: new Date()
          }
        });
      }

      // Cancel tickets
      await tx.ticket.updateMany({
        where: { bookingId: bookingId },
        data: {
          status: TicketStatus.CANCELLED,
          updatedAt: new Date()
        }
      });

      // Update category availability
      if (booking.tickets.length > 0) {
        const categoryId = booking.tickets[0].ticketCategoryId;
        await tx.ticketCategory.update({
          where: { id: categoryId },
          data: {
            bookedSeats: { decrement: booking.quantity },
            available: { increment: booking.quantity },
            updatedAt: new Date()
          }
        });

        // Update event summary
        await tx.eventSummary.updateMany({
          where: { eventId: booking.eventId },
          data: {
            bookedSeats: { decrement: booking.quantity },
            availableSeats: { increment: booking.quantity },
            updatedAt: new Date()
          }
        });
      }
    });
  }
}

export default IplBookingService;
