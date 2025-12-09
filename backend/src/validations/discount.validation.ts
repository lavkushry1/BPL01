import { z } from 'zod';

export const createDiscountSchema = z.object({
  body: z.object({
    code: z.string().min(3).max(30),
    type: z.enum(['PERCENTAGE', 'FIXED']),
    value: z.number().positive(),
    max_uses: z.number().int().min(0).optional(),
    min_amount: z.number().min(0).optional(),
    start_date: z.string().datetime(),
    end_date: z.string().datetime(),
    is_active: z.boolean().optional(),
    description: z.string().optional(),
    event_ids: z.array(z.string().uuid()).optional(),
  }),
});

export const updateDiscountSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    code: z.string().min(3).max(30).optional(),
    type: z.enum(['PERCENTAGE', 'FIXED']).optional(),
    value: z.number().positive().optional(),
    max_uses: z.number().int().min(0).optional(),
    min_amount: z.number().min(0).optional(),
    start_date: z.string().datetime().optional(),
    end_date: z.string().datetime().optional(),
    is_active: z.boolean().optional(),
    description: z.string().optional(),
    event_ids: z.array(z.string().uuid()).optional(),
  }),
});

export const applyDiscountSchema = z.object({
  body: z.object({
    code: z.string().min(1),
    amount: z.number().positive(),
    event_id: z.string().uuid().optional(),
  }),
});

export const validateDiscountSchema = z.object({
  body: z.object({
    code: z.string().min(1, 'Discount code is required'),
    booking_id: z.string().uuid('Invalid booking ID format'),
    total_amount: z.number().positive('Total amount must be positive')
  })
});

export const getByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const getByCodeSchema = z.object({
  params: z.object({
    code: z.string().min(1),
  }),
});

export const getAutoApplyDiscountSchema = z.object({
  query: z.object({
    eventId: z.string().uuid()
  })
});
