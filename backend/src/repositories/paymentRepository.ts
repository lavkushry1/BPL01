import { Prisma } from '@prisma/client';
import prisma from '../db/prisma';
import { ApiError } from '../utils/apiError';

/**
 * BookingPayment interface representing a payment in the database
 */
export interface BookingPayment {
  id: string;
  bookingId: string;
  amount: Prisma.Decimal;
  utrNumber: string | null;
  status: string;
  paymentDate: Date | null;
  verifiedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * UpiSettings interface representing UPI configuration
 */
export interface UpiSetting {
  id: string;
  upivpa: string; // Changed from vpa to upivpa to match schema
  discountamount: Prisma.Decimal; // Changed to Prisma.Decimal to match schema
  isactive: boolean; // Changed from isActive to isactive
  created_at: Date; // Changed from createdAt to created_at
  updated_at: Date; // Changed from updatedAt to updated_at
}

/**
 * Repository for booking payment operations
 */
export class BookingPaymentRepository {
  /**
   * Find a booking payment by ID
   */
  async findById(id: string): Promise<BookingPayment | null> {
    try {
      const payment = await prisma.bookingPayment.findUnique({
        where: { id }
      });

      return payment;
    } catch (error) {
      console.error('Error finding payment by ID:', error);
      throw new ApiError(500, 'Database error when finding payment');
    }
  }

  /**
   * Find a booking payment by booking ID
   */
  async findByBookingId(bookingId: string): Promise<BookingPayment | null> {
    try {
      const payment = await prisma.bookingPayment.findFirst({
        where: { bookingId }
      });

      return payment;
    } catch (error) {
      console.error('Error finding payment by booking ID:', error);
      throw new ApiError(500, 'Database error when finding payment');
    }
  }

  /**
   * Find a booking payment by UTR number
   */
  async findByUtrNumber(utrNumber: string): Promise<BookingPayment | null> {
    try {
      const payment = await prisma.bookingPayment.findFirst({
        where: { utrNumber }
      });

      return payment;
    } catch (error) {
      console.error('Error finding payment by UTR number:', error);
      throw new ApiError(500, 'Database error when finding payment');
    }
  }

  /**
   * Create a new booking payment
   */
  async create(data: any): Promise<BookingPayment> {
    try {
      const payment = await prisma.bookingPayment.create({
        data
      });

      return payment;
    } catch (error) {
      console.error('Error creating payment:', error);
      throw new ApiError(500, 'Database error when creating payment');
    }
  }

  /**
   * Update an existing booking payment
   */
  async update(id: string, data: any): Promise<BookingPayment> {
    try {
      const payment = await prisma.bookingPayment.update({
        where: { id },
        data
      });

      return payment;
    } catch (error) {
      console.error('Error updating payment:', error);
      throw new ApiError(500, 'Database error when updating payment');
    }
  }

  /**
   * Verify a payment
   */
  async verifyPayment(id: string, adminId: string): Promise<BookingPayment> {
    try {
      const payment = await prisma.bookingPayment.update({
        where: { id },
        data: {
          status: 'verified',
          verifiedBy: adminId,
          paymentDate: new Date(),
          updatedAt: new Date()
        }
      });

      return payment;
    } catch (error) {
      console.error('Error verifying payment:', error);
      throw new ApiError(500, 'Database error when verifying payment');
    }
  }

  /**
   * Reject a payment
   */
  async rejectPayment(id: string, adminId: string): Promise<BookingPayment> {
    try {
      const payment = await prisma.bookingPayment.update({
        where: { id },
        data: {
          status: 'rejected',
          verifiedBy: adminId,
          updatedAt: new Date()
        }
      });

      return payment;
    } catch (error) {
      console.error('Error rejecting payment:', error);
      throw new ApiError(500, 'Database error when rejecting payment');
    }
  }

  /**
   * Find all payments with pagination and filtering
   */
  async findAll({ skip, take, status }: { skip: number; take: number; status?: string }) {
    try {
      const where = status ? { status } : {};

      const [payments, total] = await Promise.all([
        prisma.bookingPayment.findMany({
          where,
          skip,
          take,
          orderBy: { createdAt: 'desc' },
          include: {
            booking: true
          }
        }),
        prisma.bookingPayment.count({ where })
      ]);

      return { payments, total };
    } catch (error) {
      console.error('Error finding payments:', error);
      throw new ApiError(500, 'Database error when finding payments');
    }
  }
}

/**
 * Repository for UPI settings
 */
export class UpiSettingsRepository {
  /**
   * Find active UPI settings
   */
  async findActive(): Promise<UpiSetting | null> {
    try {
      const settings = await prisma.upiSettings.findFirst({
        where: { isactive: true } // Updated field name
      });

      return settings;
    } catch (error) {
      console.error('Error finding active UPI settings:', error);
      throw new ApiError(500, 'Database error when finding UPI settings');
    }
  }

  /**
   * Create new UPI settings
   */
  async create(data: Omit<UpiSetting, 'id' | 'created_at' | 'updated_at'>): Promise<UpiSetting> {
    try {
      // Deactivate all existing settings
      await prisma.upiSettings.updateMany({
        data: { isactive: false } // Updated field name
      });

      // Create new settings
      const settings = await prisma.upiSettings.create({
        data: {
          ...data,
          created_at: new Date(),
          updated_at: new Date()
        }
      });

      return settings;
    } catch (error) {
      console.error('Error creating UPI settings:', error);
      throw new ApiError(500, 'Database error when creating UPI settings');
    }
  }

  /**
   * Update UPI settings
   */
  async update(id: string, data: Partial<Omit<UpiSetting, 'id' | 'created_at'>>): Promise<UpiSetting> {
    try {
      const settings = await prisma.upiSettings.update({
        where: { id },
        data: {
          ...data,
          updated_at: new Date() // Updated field name
        }
      });

      return settings;
    } catch (error) {
      console.error('Error updating UPI settings:', error);
      throw new ApiError(500, 'Database error when updating UPI settings');
    }
  }
}
