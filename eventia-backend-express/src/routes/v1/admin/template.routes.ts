import { Request, Response, Router } from 'express';
import { z } from 'zod';
import { auth } from '../../../middleware/auth';
import { validate } from '../../../middleware/validate';
import { ApiResponse } from '../../../utils/apiResponse';
import { asyncHandler } from '../../../utils/asyncHandler';

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
  return ApiResponse.success(res, 200, 'Resources fetched successfully');
}));

// GET /api/v1/admin/resource/:id
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  // Implementation goes here
  return ApiResponse.success(res, 200, 'Resource fetched successfully', { id });
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
    return ApiResponse.success(res, 200, 'Resource updated successfully', { id, ...data });
  })
);

// DELETE /api/v1/admin/resource/:id
router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  // Implementation goes here
  return ApiResponse.success(res, 200, 'Resource deleted successfully', { id });
}));

export default router;
