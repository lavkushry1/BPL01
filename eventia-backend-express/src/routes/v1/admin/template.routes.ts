import { Router, Request, Response } from 'express';
import { asyncHandler } from '../../../utils/asyncHandler';
import { ApiResponse } from '../../../utils/apiResponse';
import { auth } from '../../../middleware/auth';
import { validate } from '../../../middleware/validate';
import { z } from 'zod';

/**
 * ADMIN ROUTE TEMPLATE
 * 
 * Use this template to create new admin routes with consistent patterns
 * 1. Always apply 'ADMIN' role authorization
 * 2. Use Zod schemas for validation
 * 3. Use asyncHandler for all controller methods
 * 4. Use ApiResponse for standardized responses
 */

const router = Router();

// Example schema - replace with your resource schema
const exampleSchema = z.object({
  body: z.object({
    name: z.string().min(3, 'Name must be at least 3 characters'),
    description: z.string().optional()
  })
});

// Apply admin role authorization to all routes in this router
router.use(auth('ADMIN'));

// GET /api/v1/admin/resource
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  // Implementation goes here
  return ApiResponse.success(res, { message: 'Resources fetched successfully' });
}));

// GET /api/v1/admin/resource/:id
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  // Implementation goes here
  return ApiResponse.success(res, { id, message: 'Resource fetched successfully' });
}));

// POST /api/v1/admin/resource
router.post('/', 
  validate(exampleSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const data = req.body;
    // Implementation goes here
    return ApiResponse.created(res, { ...data, id: 'new-id' });
  })
);

// PUT /api/v1/admin/resource/:id
router.put('/:id',
  validate(exampleSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const data = req.body;
    // Implementation goes here
    return ApiResponse.success(res, { id, ...data });
  })
);

// DELETE /api/v1/admin/resource/:id
router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  // Implementation goes here
  return ApiResponse.success(res, { id }, 'Resource deleted successfully');
}));

export default router; 