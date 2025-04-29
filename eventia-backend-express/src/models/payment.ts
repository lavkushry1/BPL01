
import { z } from 'zod';
import { db } from '../db';

// Payment status enum
export type PaymentStatus = 'pending' | 'verified' | 'rejected' | 'refunded';

// Payment schema for validation
export const paymentSchema = z.object({
  booking_id: z.string().min(1),
  amount: z.number().positive(),
  utr_number: z.string().optional(),
  payment_date: z.string().optional(),
  status: z.enum(['pending', 'verified', 'rejected', 'refunded']),
  verified_by: z.string().optional(),
});

export type PaymentCreateInput = z.infer<typeof paymentSchema>;

// UPI Settings schema for validation
export const upiSettingsSchema = z.object({
  upiVPA: z.string().min(1),
  discountAmount: z.number().min(0),
  isActive: z.boolean(),
});

export type UpiSettingsInput = z.infer<typeof upiSettingsSchema>;

export interface Payment {
  id: string;
  booking_id: string;
  amount: number;
  utr_number?: string;
  payment_date?: string;
  status: PaymentStatus;
  verified_by?: string;
  created_at: string;
  updated_at: string;
}

export interface UpiSettings {
  id: string;
  upiVPA: string;
  discountAmount: number;
  isActive: boolean;
  created_at: string;
  updated_at: string;
}

export class PaymentModel {
  /**
   * Create a new payment record
   */
  static async create(data: PaymentCreateInput): Promise<Payment> {
    const [payment] = await db('booking_payments')
      .insert({
        booking_id: data.booking_id,
        amount: data.amount,
        utr_number: data.utr_number,
        payment_date: data.payment_date,
        status: data.status,
        verified_by: data.verified_by
      })
      .returning('*');
    
    return payment;
  }

  /**
   * Update UTR number for a payment
   */
  static async updateUtrNumber(id: string, utrNumber: string): Promise<Payment> {
    const [payment] = await db('booking_payments')
      .update({ 
        utr_number: utrNumber,
        updated_at: new Date().toISOString()
      })
      .where({ id })
      .returning('*');
    
    return payment;
  }

  /**
   * Verify a payment
   */
  static async verifyPayment(id: string, adminId: string): Promise<Payment> {
    const [payment] = await db('booking_payments')
      .update({
        status: 'verified',
        verified_by: adminId,
        payment_date: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .where({ id })
      .returning('*');
    
    return payment;
  }

  /**
   * Reject a payment
   */
  static async rejectPayment(id: string, adminId: string): Promise<Payment> {
    const [payment] = await db('booking_payments')
      .update({
        status: 'rejected',
        verified_by: adminId,
        updated_at: new Date().toISOString()
      })
      .where({ id })
      .returning('*');
    
    return payment;
  }

  /**
   * Get payment by ID
   */
  static async getById(id: string): Promise<Payment | null> {
    const payment = await db('booking_payments')
      .select('*')
      .where({ id })
      .first();
    
    return payment || null;
  }

  /**
   * Get payment by booking ID
   */
  static async getByBookingId(bookingId: string): Promise<Payment | null> {
    const payment = await db('booking_payments')
      .select('*')
      .where({ booking_id: bookingId })
      .first();
    
    return payment || null;
  }

  /**
   * Get all payments
   */
  static async getAll(
    page = 1, 
    limit = 10, 
    status?: PaymentStatus
  ): Promise<{ payments: Payment[]; total: number }> {
    const query = db('booking_payments').select('*');
    
    if (status) {
      query.where({ status });
    }
    
    const offset = (page - 1) * limit;
    const [paymentsResult, countResult] = await Promise.all([
      query.clone().offset(offset).limit(limit).orderBy('created_at', 'desc'),
      query.clone().count('* as count').first()
    ]);
    
    return {
      payments: paymentsResult,
      total: Number(countResult?.count || 0)
    };
  }
}

export class UpiSettingsModel {
  /**
   * Get active UPI settings
   */
  static async getActive(): Promise<UpiSettings | null> {
    const settings = await db('upi_settings')
      .select('*')
      .where({ isactive: true })
      .first();
    
    if (!settings) return null;
    
    // Convert DB column names to camelCase for API consistency
    return {
      id: settings.id,
      upiVPA: settings.upivpa,
      discountAmount: settings.discountamount,
      isActive: settings.isactive,
      created_at: settings.created_at,
      updated_at: settings.updated_at
    };
  }

  /**
   * Update UPI settings
   */
  static async update(id: string, data: UpiSettingsInput): Promise<UpiSettings> {
    const [settings] = await db('upi_settings')
      .update({
        upivpa: data.upiVPA,
        discountamount: data.discountAmount,
        isactive: data.isActive,
        updated_at: new Date().toISOString()
      })
      .where({ id })
      .returning('*');
    
    // Convert DB column names to camelCase for API consistency
    return {
      id: settings.id,
      upiVPA: settings.upivpa,
      discountAmount: settings.discountamount,
      isActive: settings.isactive,
      created_at: settings.created_at,
      updated_at: settings.updated_at
    };
  }

  /**
   * Create UPI settings
   */
  static async create(data: UpiSettingsInput): Promise<UpiSettings> {
    // If isActive is true, deactivate all other settings first
    if (data.isActive) {
      await db('upi_settings')
        .update({ isactive: false, updated_at: new Date().toISOString() });
    }
    
    const [settings] = await db('upi_settings')
      .insert({
        upivpa: data.upiVPA,
        discountamount: data.discountAmount,
        isactive: data.isActive,
      })
      .returning('*');
    
    // Convert DB column names to camelCase for API consistency
    return {
      id: settings.id,
      upiVPA: settings.upivpa,
      discountAmount: settings.discountamount,
      isActive: settings.isactive,
      created_at: settings.created_at,
      updated_at: settings.updated_at
    };
  }
}
