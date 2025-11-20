import { PaymentStatus } from '@prisma/client';
import { Omit } from '@prisma/client/runtime/library';
import { Payment } from '../models/payment.model';
import { ApiError } from '../utils/apiError';
import { prisma } from '../db/prisma';

export const paymentService = {
  /**
   * Create a new UTR payment record (BookingPayment)
   */
  async createUTRPayment(data: {
    booking_id: string;
    amount: number;
    utr_number: string;
    status: string;
    payment_date?: Date;
  }) {
    try {
      // Check if BookingPayment already exists
      const existing = await prisma.bookingPayment.findUnique({
        where: { bookingId: data.booking_id }
      });

      if (existing) {
        return await prisma.bookingPayment.update({
          where: { bookingId: data.booking_id },
          data: {
            utrNumber: data.utr_number,
            status: data.status,
            paymentDate: data.payment_date || new Date()
          }
        });
      }

      return await prisma.bookingPayment.create({
        data: {
          bookingId: data.booking_id,
          amount: data.amount,
          utrNumber: data.utr_number,
          status: data.status,
          paymentDate: data.payment_date || new Date()
        }
      });
    } catch (error) {
      console.error('Error creating UTR payment:', error);
      throw new ApiError(500, 'Failed to create UTR payment record');
    }
  },

  /**
   * Create a generic payment record
   */
  async createPayment(data: Omit<Payment, 'id' | 'created_at'>) {
    try {
      // Map to Prisma Payment model
      // Note: Prisma Payment model is different from the Payment interface
      // We'll try to save what we can to the Payment table

      const statusMap: Record<string, PaymentStatus> = {
        'pending': PaymentStatus.PENDING,
        'verified': PaymentStatus.COMPLETED,
        'rejected': PaymentStatus.FAILED,
        'refunded': PaymentStatus.REFUNDED
      };

      const prismaStatus = statusMap[data.status] || PaymentStatus.PENDING;

      return await prisma.payment.create({
        data: {
          bookingId: data.booking_id,
          amount: data.amount,
          status: prismaStatus,
          method: data.payment_method || 'unknown'
        }
      });
    } catch (error) {
      console.error('Error creating payment:', error);
      throw new ApiError(500, 'Failed to create payment record');
    }
  },

  /**
   * Get payment by booking ID
   */
  async getPaymentByBookingId(bookingId: string) {
    try {
      return await prisma.bookingPayment.findUnique({
        where: { bookingId }
      });
    } catch (error) {
      throw new ApiError(500, 'Failed to fetch payment');
    }
  },

  /**
   * Verify a payment (Admin)
   */
  async verifyPayment(bookingId: string, adminId: string) {
    try {
      // Start a transaction to update both BookingPayment and Booking
      return await prisma.$transaction(async (tx) => {
        // 1. Update BookingPayment
        const payment = await tx.bookingPayment.update({
          where: { bookingId },
          data: {
            status: 'verified',
            verifiedBy: adminId
          }
        });

        // 2. Update Booking status
        await tx.booking.update({
          where: { id: bookingId },
          data: { status: 'CONFIRMED' }
        });

        // 3. Update main Payment record if exists
        const mainPayment = await tx.payment.findUnique({
          where: { bookingId }
        });

        if (mainPayment) {
          await tx.payment.update({
            where: { bookingId },
            data: { status: PaymentStatus.COMPLETED }
          });
        }

        return payment;
      });
    } catch (error) {
      console.error('Error verifying payment:', error);
      throw new ApiError(500, 'Failed to verify payment');
    }
  },

  /**
   * Reject a payment
   */
  async rejectPayment(bookingId: string, adminId: string) {
    try {
      return await prisma.bookingPayment.update({
        where: { bookingId },
        data: {
          status: 'rejected',
          verifiedBy: adminId
        }
      });
    } catch (error) {
      throw new ApiError(500, 'Failed to reject payment');
    }
  }
};
