import { z } from 'zod';

export const lockSeatsSchema = z.object({
  body: z.object({
    seat_ids: z.array(z.string().uuid('Invalid seat ID format')).min(1, 'At least one seat ID is required'),
    event_id: z.string().uuid('Invalid event ID format'),
    user_id: z.string().uuid('Invalid user ID format'),
    duration: z.number().positive('Duration must be positive').optional()
  }),
  params: z.object({}),
  query: z.object({})
});

export const releaseSeatsSchema = z.object({
  body: z.object({
    seat_ids: z.array(z.string().uuid('Invalid seat ID format')).min(1, 'At least one seat ID is required'),
    event_id: z.string().uuid('Invalid event ID format'),
    user_id: z.string().uuid('Invalid user ID format')
  }),
  params: z.object({}),
  query: z.object({})
});

export const checkSeatsLockedSchema = z.object({
  body: z.object({}),
  params: z.object({}),
  query: z.object({
    seat_ids: z.array(z.string().uuid('Invalid seat ID format')).min(1, 'At least one seat ID is required'),
    event_id: z.string().uuid('Invalid event ID format')
  })
});

export const extendLockSchema = z.object({
  body: z.object({
    seat_ids: z.array(z.string().uuid('Invalid seat ID format')).min(1, 'At least one seat ID is required'),
    event_id: z.string().uuid('Invalid event ID format'),
    user_id: z.string().uuid('Invalid user ID format'),
    duration: z.number().positive('Duration must be positive').optional()
  }),
  params: z.object({}),
  query: z.object({})
});

export const confirmSeatsSchema = z.object({
  body: z.object({
    seat_ids: z.array(z.string().uuid('Invalid seat ID format')).min(1, 'At least one seat ID is required'),
    event_id: z.string().uuid('Invalid event ID format'),
    user_id: z.string().uuid('Invalid user ID format'),
    booking_id: z.string().uuid('Invalid booking ID format')
  }),
  params: z.object({}),
  query: z.object({})
});