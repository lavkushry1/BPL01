import { Request, Response, Router } from 'express';
import { z } from 'zod';
import { standardLimiter } from '../../../middleware/rateLimit';
import { validate } from '../../../middleware/validate';
import { ApiResponse } from '../../../utils/apiResponse';
import { asyncHandler } from '../../../utils/asyncHandler';

/**
 * PUBLIC ROUTE TEMPLATE
 *
 * Use this template to create new public routes with consistent patterns
 * 1. Apply rate limiting where appropriate
 * 2. Use Zod schemas for validation
 * 3. Use asyncHandler for all controller methods
 * 4. Use ApiResponse for standardized responses
 */

const router = Router();

// Example schema - replace with your resource schema
const exampleQuerySchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    sort: z.enum(['asc', 'desc']).optional()
  }),
  params: z.object({}),
  body: z.object({})
});

// GET /api/v1/public/resource
router.get('/',
  standardLimiter,
  validate(exampleQuerySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { page = 1, limit = 10, sort = 'asc' } = req.query;
    // Implementation goes here
    return ApiResponse.success(res, 200, 'Resources fetched successfully', {
      items: [],
      page,
      limit,
      sort
    });
  })
);

// GET /api/v1/public/resource/:id
router.get('/:id',
  standardLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    // Implementation goes here
    return ApiResponse.success(res, 200, 'Resource fetched successfully', { id, name: 'Example Resource' });
  })
);

export default router;
