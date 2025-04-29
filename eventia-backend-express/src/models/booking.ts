
import { z } from 'zod';
import { db } from '../db';

// Booking status enum
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled';

// Booking schema for validation
export const bookingSchema = z.object({
  user_id: z.string().uuid(),
  event_id: z.string().uuid(),
  seats: z.array(z.string()).min(1, 'At least one seat is required'),
  total_amount: z.number().positive(),
  discount_applied: z.number().min(0).optional(),
  final_amount: z.number().positive(),
  status: z.enum(['pending', 'confirmed', 'cancelled']),
});

export type BookingCreateInput = z.infer<typeof bookingSchema>;

// Delivery details schema
export const deliveryDetailsSchema = z.object({
  booking_id: z.string().uuid(),
  name: z.string().min(1, 'Name is required'),
  phone: z.string().min(10, 'Phone number must be at least 10 characters'),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  pincode: z.string().min(1, 'Pincode is required'),
});

export type DeliveryDetailsInput = z.infer<typeof deliveryDetailsSchema>;

export interface Booking {
  id: string;
  user_id: string;
  event_id: string;
  seats: string[];
  total_amount: number;
  discount_applied?: number;
  final_amount: number;
  booking_date: Date;
  status: BookingStatus;
  created_at: Date;
  updated_at: Date;
}

export interface DeliveryDetails {
  id: string;
  booking_id: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  pincode: string;
  created_at: Date;
  updated_at: Date;
}

export class BookingModel {
  /**
   * Create a new booking
   */
  static async create(data: BookingCreateInput): Promise<Booking> {
    const [booking] = await db('bookings')
      .insert({
        user_id: data.user_id,
        event_id: data.event_id,
        seats: JSON.stringify(data.seats),
        total_amount: data.total_amount,
        discount_applied: data.discount_applied,
        final_amount: data.final_amount,
        status: data.status || 'pending',
        booking_date: new Date(),
      })
      .returning('*');

    return {
      ...booking,
      seats: JSON.parse(booking.seats),
    };
  }

  /**
   * Get booking by ID
   */
  static async getById(id: string): Promise<Booking | null> {
    const booking = await db('bookings')
      .select('*')
      .where({ id })
      .first();

    if (!booking) return null;

    return {
      ...booking,
      seats: JSON.parse(booking.seats),
    };
  }
  
  /**
   * Get bookings by user ID
   */
  static async getByUserId(userId: string): Promise<Booking[]> {
    const bookings = await db('bookings')
      .select('*')
      .where({ user_id: userId })
      .orderBy('created_at', 'desc');

    return bookings.map((booking) => ({
      ...booking,
      seats: JSON.parse(booking.seats),
    }));
  }

  /**
   * Get bookings by event ID
   */
  static async getByEventId(eventId: string): Promise<Booking[]> {
    const bookings = await db('bookings')
      .select('*')
      .where({ event_id: eventId })
      .orderBy('created_at', 'desc');

    return bookings.map((booking) => ({
      ...booking,
      seats: JSON.parse(booking.seats),
    }));
  }

  /**
   * Update booking status
   */
  static async updateStatus(id: string, status: BookingStatus): Promise<Booking> {
    const [booking] = await db('bookings')
      .update({
        status,
        updated_at: new Date(),
      })
      .where({ id })
      .returning('*');

    return {
      ...booking,
      seats: JSON.parse(booking.seats),
    };
  }

  /**
   * Add delivery details to a booking
   */
  static async addDeliveryDetails(data: DeliveryDetailsInput): Promise<DeliveryDetails> {
    const [deliveryDetails] = await db('delivery_details')
      .insert(data)
      .returning('*');

    return deliveryDetails;
  }

  /**
   * Get delivery details by booking ID
   */
  static async getDeliveryDetailsByBookingId(bookingId: string): Promise<DeliveryDetails | null> {
    const deliveryDetails = await db('delivery_details')
      .select('*')
      .where({ booking_id: bookingId })
      .first();

    return deliveryDetails || null;
  }

  /**
   * Get all bookings with pagination
   */
  static async getAll(
    page = 1,
    limit = 10,
    status?: BookingStatus
  ): Promise<{ bookings: Booking[]; total: number }> {
    const query = db('bookings').select('*');
    
    if (status) {
      query.where({ status });
    }
    
    const offset = (page - 1) * limit;
    const [bookingsResult, countResult] = await Promise.all([
      query.clone().offset(offset).limit(limit).orderBy('created_at', 'desc'),
      query.clone().count('* as count').first()
    ]);
    
    const bookings = bookingsResult.map((booking) => ({
      ...booking,
      seats: JSON.parse(booking.seats),
    }));
    
    return {
      bookings,
      total: Number(countResult?.count || 0)
    };
  }
}
