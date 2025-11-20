import { z } from 'zod';

export const createBookingSchema = z.object({
  body: z.object({
    event_id: z.string().min(1, 'Event ID is required'),
    user_id: z.string().min(1, 'User ID is required'),
    seat_ids: z.array(z.string().min(1)).optional(),
    amount: z.number().positive('Amount must be greater than zero'),
    payment_method: z.string().min(1, 'Payment method is required')
  }),
  params: z.object({}),
  query: z.object({})
});

export const getBookingSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Booking ID is required')
  }),
  body: z.object({}),
  query: z.object({})
});

export const saveDeliveryDetailsSchema = z.object({
  body: z.object({
    booking_id: z.string().min(1, 'Booking ID is required'),
    name: z.string().min(1, 'Name is required'),
    phone: z.string().min(8, 'Phone number is required'),
    address: z.string().min(1, 'Address is required'),
    city: z.string().min(1, 'City is required'),
    pincode: z.string().min(4, 'Pincode is required')
  }),
  params: z.object({}),
  query: z.object({})
});

export const updateBookingStatusSchema = z.object({
  body: z.object({
    status: z.string().min(1, 'Status is required')
  }),
  params: z.object({
    id: z.string().min(1, 'Booking ID is required')
  }),
  query: z.object({})
});

export const cancelBookingSchema = z.object({
  body: z.object({
    cancellation_reason: z.string().optional()
  }),
  params: z.object({
    id: z.string().min(1, 'Booking ID is required')
  }),
  query: z.object({})
}); 
