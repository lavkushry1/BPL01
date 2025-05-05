import { Router, Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../../../utils/asyncHandler';
import { ApiResponse } from '../../../utils/apiResponse';
import { auth } from '../../../middleware/auth';
import { validate } from '../../../middleware/validate';
import { z } from 'zod';
import { EventControllerV1 } from '../../../controllers/v1/event.controller';

/**
 * Admin Event Routes
 * Contains admin operations for event management
 */
const router = Router();

// Apply admin role authorization to all routes
router.use(auth('ADMIN'));

// Schema for creating an event
const createEventSchema = z.object({
  body: z.object({
    title: z.string().min(3, 'Title must be at least 3 characters'),
    description: z.string().optional(),
    startDate: z.string().datetime('Invalid start date format'),
    endDate: z.string().datetime('Invalid end date format').optional(),
    location: z.string().min(3, 'Location must be at least 3 characters'),
    category: z.string().optional(),
    status: z.enum(['DRAFT', 'PUBLISHED', 'CANCELLED']).optional().default('DRAFT'),
    ticketCategories: z.array(
      z.object({
        name: z.string().min(1, 'Name is required'),
        description: z.string().optional(),
        price: z.number().positive('Price must be positive'),
        quantity: z.number().int().positive('Quantity must be positive')
      })
    ).optional()
  }),
  params: z.object({}),
  query: z.object({})
});

// Schema for updating an event (similar to create but all fields optional)
const updateEventSchema = z.object({
  body: z.object({
    title: z.string().min(3, 'Title must be at least 3 characters').optional(),
    description: z.string().optional(),
    startDate: z.string().datetime('Invalid start date format').optional(),
    endDate: z.string().datetime('Invalid end date format').optional(),
    location: z.string().min(3, 'Location must be at least 3 characters').optional(),
    category: z.string().optional(),
    status: z.enum(['DRAFT', 'PUBLISHED', 'CANCELLED']).optional(),
    ticketCategories: z.array(
      z.object({
        name: z.string().min(1, 'Name is required'),
        description: z.string().optional(),
        price: z.number().positive('Price must be positive'),
        quantity: z.number().int().positive('Quantity must be positive')
      })
    ).optional()
  }),
  params: z.object({
    id: z.string().uuid('Invalid event ID format')
  }),
  query: z.object({})
});

/**
 * @route POST /api/v1/admin/events
 * @desc Create a new event
 * @access Admin
 */
router.post('/', 
  validate(createEventSchema),
  asyncHandler(EventControllerV1.createEvent)
);

/**
 * @route PUT /api/v1/admin/events/:id
 * @desc Update an existing event
 * @access Admin
 */
router.put('/:id',
  validate(updateEventSchema),
  asyncHandler(EventControllerV1.updateEvent)
);

/**
 * @route DELETE /api/v1/admin/events/:id
 * @desc Delete an event
 * @access Admin
 */
router.delete('/:id', 
  asyncHandler(EventControllerV1.deleteEvent)
);

/**
 * @route GET /api/v1/admin/events/stats
 * @desc Get event statistics
 * @access Admin
 */
router.get('/stats', 
  asyncHandler(EventControllerV1.getEventStats)
);

export default router; 