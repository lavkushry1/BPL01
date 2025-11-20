import { NextFunction, Request, Response, Router } from 'express';
import { z } from 'zod';
import { login, logout, me, refreshToken, register } from '../../controllers/authController';
import { auth } from '../../middleware/auth';
import { loginLimiter } from '../../middleware/rateLimit';
import { validate } from '../../middleware/validate';
import { loginSchema, registerSchema } from '../../models/user';
import { asyncHandler } from '../../utils/asyncHandler';

/**
 * Authentication routes
 */
const router = Router();

// Register user
router.post('/register',
  validate(z.object({ body: registerSchema })),
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

// CSRF Token endpoint
router.get('/csrf', (req: Request, res: Response) => {
  // The middleware already sets the token in headers/cookies
  res.json({ success: true, message: 'CSRF token generated' });
});

export default router;
