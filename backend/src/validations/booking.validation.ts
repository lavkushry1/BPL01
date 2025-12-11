import { z } from 'zod';

export const createBookingSchema = z.object({
  body: z.object({
    event_id: z.string().min(1, 'Event ID is required'),
    seat_ids: z.array(z.string()).optional(),
    tickets: z.array(z.object({
      categoryId: z.string(), // This maps to Section Name/ID
      quantity: z.number().positive(),
      price: z.number().optional()
    })).optional(),
    amount: z.number().positive('Amount must be positive'),
    // Support both uppercase and lowercase for compatibility
    payment_method: z.enum(['STRIPE', 'UPI', 'CASH', 'CARD', 'stripe', 'upi', 'cash', 'card']).optional().default('STRIPE'),
    // Guest details
    guest_name: z.string().optional(),
    guest_email: z.string().email('Invalid email format').optional(),
    guest_phone: z.string().optional(),
  }),
});

export const updateBookingStatusSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid booking ID format'),
  }),
  body: z.object({
    status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'FAILED', 'REFUNDED']),
  }),
});

export const saveDeliveryDetailsSchema = z.object({
  body: z.object({
    booking_id: z.string().uuid('Invalid booking ID format'),
    name: z.string().min(2, 'Name must be at least 2 characters').max(100),
    phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format'),
    address: z.string().min(5, 'Address must be at least 5 characters'),
    city: z.string().min(2, 'City must be at least 2 characters'),
    pincode: z.string().regex(/^\d{4,10}$/, 'Invalid pincode format'),
  }),
});

export const cancelBookingSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid booking ID format'),
  }),
  body: z.object({
    cancellation_reason: z.string().optional(),
  }),
});

export const getBookingSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid booking ID format'),
  }),
});
