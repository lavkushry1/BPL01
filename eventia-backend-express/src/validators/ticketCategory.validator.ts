import { z } from 'zod';

export const createTicketCategorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  price: z.number().min(0, 'Price must be non-negative'),
  totalSeats: z.number().int().positive('Total seats must be positive'),
  eventId: z.string().uuid('Invalid Event ID'),
});

export const updateTicketCategorySchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  description: z.string().optional(),
  price: z.number().min(0, 'Price must be non-negative').optional(),
  totalSeats: z.number().int().positive('Total seats must be positive').optional(),
});

export const updateBookedSeatsSchema = z.object({
  bookedSeats: z.number().int().min(0, 'Booked seats cannot be negative'),
});
