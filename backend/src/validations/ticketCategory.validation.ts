import { z } from 'zod';
import { objectId } from './custom.validation';

export const createTicketCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required'),
    description: z.string().optional(),
    price: z.number().positive('Price must be positive'),
    minimumPrice: z.number().positive('Minimum price must be positive').optional(),
    totalSeats: z.number().int().positive('Total seats must be positive'),
    eventId: z.string().refine(val => objectId(val), 'Invalid event ID')
  })
});

export const updateTicketCategorySchema = z.object({
  params: z.object({
    id: z.string().refine(val => objectId(val), 'Invalid ticket category ID')
  }),
  body: z.object({
    name: z.string().min(1, 'Name is required').optional(),
    description: z.string().optional(),
    price: z.number().positive('Price must be positive').optional(),
    minimumPrice: z.number().positive('Minimum price must be positive').optional(),
    totalSeats: z.number().int().positive('Total seats must be positive').optional()
  })
});

export const updateBookedSeatsSchema = z.object({
  params: z.object({
    id: z.string().refine(val => objectId(val), 'Invalid ticket category ID')
  }),
  body: z.object({
    bookedSeats: z.number().int().nonnegative('Booked seats cannot be negative')
  })
});

export const getByIdSchema = z.object({
  params: z.object({
    id: z.string().refine(val => objectId(val), 'Invalid ticket category ID')
  })
});

export const getByEventIdSchema = z.object({
  params: z.object({
    eventId: z.string().refine(val => objectId(val), 'Invalid event ID')
  })
});

const ticketCategoryValidation = {
  createTicketCategory: createTicketCategorySchema,
  updateTicketCategory: updateTicketCategorySchema,
  updateBookedSeats: updateBookedSeatsSchema,
  getById: getByIdSchema,
  getByEventId: getByEventIdSchema
};

export default ticketCategoryValidation; 