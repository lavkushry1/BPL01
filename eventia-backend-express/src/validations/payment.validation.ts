import { z } from 'zod';
import { paymentSchema, upiSettingsSchema as upiSettingsModelSchema } from '../models/payment';

export const initializePaymentSchema = z.object({
  body: z.object({
    booking_id: z.string().uuid('Invalid booking ID format'),
    amount: z.number().positive('Amount must be positive'),
    payment_method: z.enum(['upi', 'card', 'netbanking', 'wallet'], {
      errorMap: () => ({ message: 'Invalid payment method' })
    }),
    currency: z.string().default('INR').optional()
  }),
  params: z.object({}),
  query: z.object({})
});

export const verifyPaymentUtrSchema = z.object({
  body: z.object({
    payment_id: z.string().uuid('Invalid payment ID format'),
    utr_number: z.string().min(1, 'UTR number is required'),
    user_id: z.string().uuid('Invalid user ID format')
  }),
  params: z.object({}),
  query: z.object({})
});


export const createPaymentSchema = z.object({
  body: paymentSchema,
  params: z.object({}),
  query: z.object({})
});

export const updateUtrSchema = z.object({
  body: z.object({
    utrNumber: z.string().min(1, 'UTR number is required')
  }),
  params: z.object({
    id: z.string().min(1, 'Payment ID is required')
  }),
  query: z.object({})
});

export const getPaymentSchema = z.object({
  body: z.object({}),
  params: z.object({
    id: z.string().min(1, 'Payment ID is required')
  }),
  query: z.object({})
});

export const getPaymentByBookingIdSchema = z.object({
  body: z.object({}),
  params: z.object({
    bookingId: z.string().min(1, 'Booking ID is required')
  }),
  query: z.object({})
});

export const getAllPaymentsSchema = z.object({
  body: z.object({}),
  params: z.object({}),
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    status: z.enum(['pending', 'verified', 'rejected', 'refunded']).optional()
  })
});

export const verifyPaymentSchema = z.object({
  body: z.object({}),
  params: z.object({
    id: z.string().min(1, 'Payment ID is required')
  }),
  query: z.object({})
});

export const rejectPaymentSchema = z.object({
  body: z.object({}),
  params: z.object({
    id: z.string().min(1, 'Payment ID is required')
  }),
  query: z.object({})
});

export const upiSettingsValidationSchema = z.object({
  body: upiSettingsModelSchema,
  params: z.object({}),
  query: z.object({})
});

export const updateUpiSettingsSchema = z.object({
  body: upiSettingsModelSchema,
  params: z.object({
    id: z.string().min(1, 'Settings ID is required')
  }),
  query: z.object({})
});

export const webhookSchema = z.object({
  body: z.object({
    event: z.string().min(1, 'Event type is required'),
    paymentId: z.string().optional(),
    transactionId: z.string().optional(),
    failureReason: z.string().optional(),
    refundAmount: z.number().optional(),
    metadata: z.record(z.any()).optional()
  }),
  params: z.object({}),
  query: z.object({})
});
