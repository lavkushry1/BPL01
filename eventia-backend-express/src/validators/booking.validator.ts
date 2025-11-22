import { z } from 'zod';

export const createBookingSchema = z.object({
  event_id: z.string().uuid('Invalid Event ID'),
  user_id: z.string().uuid('Invalid User ID'),
  seat_ids: z.array(z.string()).optional(),
  amount: z.number().positive('Amount must be positive'),
  payment_method: z.enum(['UPI', 'CARD', 'NET_BANKING']).default('UPI'),
});

export const saveDeliveryDetailsSchema = z.object({
  booking_id: z.string().uuid('Invalid Booking ID'),
  name: z.string().min(2, 'Name is too short'),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number'),
  address: z.string().min(5, 'Address is too short'),
  city: z.string().min(2, 'City is too short'),
  pincode: z.string().regex(/^\d{6}$/, 'Invalid Pincode'),
});

export const updateBookingStatusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'FAILED']),
});

export const cancelBookingSchema = z.object({
  cancellation_reason: z.string().optional(),
});
