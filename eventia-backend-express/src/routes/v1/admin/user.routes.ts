import { Router, Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../../../utils/asyncHandler';
import { ApiResponse } from '../../../utils/apiResponse';
import { auth } from '../../../middleware/auth';
import { validate } from '../../../middleware/validate';
import { z } from 'zod';
import { UserController } from '../../../controllers/user.controller';

/**
 * Admin User Routes
 * Contains admin operations for user management
 */
const router = Router();

// Apply admin role authorization to all routes
router.use(auth('ADMIN'));

// Schema for user create/update
const userSchema = z.object({
  body: z.object({
    name: z.string().min(3, 'Name must be at least 3 characters'),
    email: z.string().email('Invalid email format'),
    role: z.enum(['USER', 'ADMIN', 'MANAGER']).optional(),
    password: z.string().min(6, 'Password must be at least 6 characters').optional()
  }),
  params: z.object({}),
  query: z.object({})
});

// Schema for user update (partial)
const userUpdateSchema = z.object({
  body: z.object({
    name: z.string().min(3, 'Name must be at least 3 characters').optional(),
    email: z.string().email('Invalid email format').optional(),
    role: z.enum(['USER', 'ADMIN', 'MANAGER']).optional()
  }),
  params: z.object({
    id: z.string().uuid('Invalid user ID format')
  }),
  query: z.object({})
});

// Schema for list users query
const listUsersSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    role: z.string().optional()
  }),
  params: z.object({}),
  body: z.object({})
});

/**
 * @route GET /api/v1/admin/users
 * @desc Get all users (with pagination)
 * @access Admin
 */
router.get('/', 
  validate(listUsersSchema),
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    // Pass to controller
    await UserController.getAllUsers(req as any, res, next);
  })
);

/**
 * @route GET /api/v1/admin/users/:id
 * @desc Get user by ID
 * @access Admin
 */
router.get('/:id', 
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    // Pass to controller
    await UserController.getUserById(req as any, res, next);
  })
);

/**
 * @route PUT /api/v1/admin/users/:id
 * @desc Update user
 * @access Admin
 */
router.put('/:id',
  validate(userUpdateSchema),
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    // Pass to controller
    await UserController.updateUser(req as any, res, next);
  })
);

/**
 * @route DELETE /api/v1/admin/users/:id
 * @desc Delete user
 * @access Admin
 */
router.delete('/:id', 
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    // Pass to controller
    await UserController.deleteUser(req as any, res, next);
  })
);

export default router; 