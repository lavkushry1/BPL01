import { z } from 'zod';

/**
 * SeatLock Schema
 * Represents a temporary lock on a seat during the booking process
 */
export const seatLockSchema = z.object({
  seatId: z.string().uuid(),
  userId: z.string().uuid(),
  expiresAt: z.date(),
});

/**
 * SeatLock type
 */
export type SeatLock = z.infer<typeof seatLockSchema>;

/**
 * SeatLock status enum
 */
export enum SeatLockStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  RELEASED = 'released',
}

/**
 * Create SeatLock schema
 */
export const createSeatLockSchema = z.object({
  body: z.object({
    seatId: z.string().uuid("Invalid seat ID format"),
    userId: z.string().uuid("Invalid user ID format"),
    duration: z.number().positive().optional(),
  }),
  params: z.object({}),
  query: z.object({}),
});

/**
 * Release SeatLock schema
 */
export const releaseSeatLockSchema = z.object({
  body: z.object({
    seatId: z.string().uuid("Invalid seat ID format"),
    userId: z.string().uuid("Invalid user ID format"),
  }),
  params: z.object({}),
  query: z.object({}),
});

/**
 * Check SeatLock schema
 */
export const checkSeatLockSchema = z.object({
  body: z.object({}),
  params: z.object({
    seatId: z.string().uuid("Invalid seat ID format"),
  }),
  query: z.object({}),
});

/**
 * Bulk Check SeatLocks schema
 */
export const bulkCheckSeatLocksSchema = z.object({
  body: z.object({
    seatIds: z.array(z.string().uuid("Invalid seat ID format")).min(1, "At least one seat ID is required"),
  }),
  params: z.object({}),
  query: z.object({}),
}); 