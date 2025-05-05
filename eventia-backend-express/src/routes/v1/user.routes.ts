import { Router, Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiResponse } from '../../utils/apiResponse';
import { validate } from '../../middleware/validate';
import { auth } from '../../middleware/auth';
import { z } from 'zod';
import { errorBoundary } from '../../middleware/errorBoundary';
import { UserControllerV1 } from '../../controllers/v1/user.controller';

/**
 * User routes
 * Contains both general user routes and profile management
 */
const router = Router();

// Apply authentication to all user routes
router.use(auth());

// Schema for profile update
const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(3, 'Name must be at least 3 characters').optional(),
    email: z.string().email('Invalid email format').optional(),
    phone: z.string().optional(),
    address: z.object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      postalCode: z.string().optional(),
      country: z.string().optional()
    }).optional()
  }),
  params: z.object({}),
  query: z.object({})
});

/**
 * @route GET /api/v1/users/profile
 * @desc Get current user profile
 * @access Private
 */
router.get('/profile', asyncHandler(UserControllerV1.getProfile));

/**
 * @route PUT /api/v1/users/profile
 * @desc Update user profile
 * @access Private
 */
router.put('/profile', 
  validate(updateProfileSchema),
  asyncHandler(UserControllerV1.updateProfile)
);

/**
 * @route GET /api/v1/users/tickets
 * @desc Get user's tickets
 * @access Private
 */
router.get('/tickets', asyncHandler(UserControllerV1.getUserTickets));

// Admin-only routes - should move to admin directory in future
// We'll include them here for backward compatibility

// Export the router
export default router; 