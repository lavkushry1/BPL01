import { z } from 'zod';

export const validateDiscountSchema = z.object({
  body: z.object({
    code: z.string().min(1, 'Discount code is required'),
    booking_id: z.string().uuid('Invalid booking ID format'),
    total_amount: z.number().positive('Total amount must be positive')
  })
}); 