import { EventStatus } from '@prisma/client';
import { z } from 'zod';

// Helper for date validation (accepts string or Date, transforms to Date)
const dateSchema = z.union([z.string(), z.date()]).transform((val) => new Date(val));

// Ticket Category Input Schema
const ticketCategoryInputSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  price: z.number().min(0, 'Price must be non-negative'),
  totalSeats: z.number().int().positive('Total seats must be positive'),
});

// Event Create Schema
export const createEventSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100),
  description: z.string().optional(),
  startDate: dateSchema,
  endDate: dateSchema.optional(),
  location: z.string().min(1, 'Location is required'),
  status: z.nativeEnum(EventStatus).default(EventStatus.DRAFT),
  capacity: z.number().int().positive().optional(),
  imageUrl: z.string().url().optional(),
  ticketCategories: z.array(ticketCategoryInputSchema).optional(),
  categoryIds: z.array(z.string()).optional(),
}).refine((data) => {
  if (data.endDate && data.startDate > data.endDate) {
    return false;
  }
  return true;
}, {
  message: "End date must be after start date",
  path: ["endDate"],
});

// Event Update Schema
export const updateEventSchema = z.object({
  title: z.string().min(3).max(100).optional(),
  description: z.string().optional(),
  startDate: dateSchema.optional(),
  endDate: dateSchema.optional(),
  location: z.string().optional(),
  status: z.nativeEnum(EventStatus).optional(),
  capacity: z.number().int().positive().optional(),
  imageUrl: z.string().url().optional(),
  ticketCategories: z.array(ticketCategoryInputSchema).optional(),
  categoryIds: z.array(z.string()).optional(),
}).refine((data) => {
  if (data.startDate && data.endDate && data.startDate > data.endDate) {
    return false;
  }
  return true;
}, {
  message: "End date must be after start date",
  path: ["endDate"],
});

// Event Filter Schema
export const eventFilterSchema = z.object({
  category: z.string().optional(),
  date: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  search: z.string().optional(),
  status: z.nativeEnum(EventStatus).optional(),
  organizerId: z.string().optional(),
  page: z.string().transform(Number).pipe(z.number().int().positive()).optional(),
  limit: z.string().transform(Number).pipe(z.number().int().positive()).optional(),
  cursor: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  include: z.string().optional(),
  fields: z.string().optional(),
  ids: z.string().optional(),
});
