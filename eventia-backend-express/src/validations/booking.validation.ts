import { z } from 'zod';

export const cancelBookingSchema = z.object({
  body: z.object({
    cancellation_reason: z.string().optional()
  }),
  params: z.object({
    id: z.string().min(1, 'Booking ID is required')
  }),
  query: z.object({})
}); 