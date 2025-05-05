import { Router, Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiResponse } from '../../utils/apiResponse';
import { validate } from '../../middleware/validate';
import { userSchema, loginSchema } from '../../models/user';
import { z } from 'zod';
import { loginLimiter } from '../../middleware/rateLimit';
import { auth } from '../../middleware/auth';
import { register, login, refreshToken, logout, me } from '../../controllers/authController';

/**
 * Authentication routes
 */
const router = Router();

// Register user
router.post('/register', 
  validate(z.object({ body: userSchema })),
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    await register(req, res, next);
  })
);

// Login user
router.post('/login', 
  loginLimiter,
  validate(z.object({ body: loginSchema })),
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    await login(req, res, next);
  })
);

// Refresh auth token
router.post('/refresh-token', 
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    await refreshToken(req, res, next);
  })
);

// Logout user
router.post('/logout', 
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    await logout(req, res, next);
  })
);

// Get current user
router.get('/me', 
  auth(),
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    await me(req, res, next);
  })
);

export default router; 