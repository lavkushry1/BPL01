import { NextFunction, Request, Response } from 'express';
import { createLoaders, Loaders } from '../utils/dataloader';

// Extend Express Request type to include our loaders
/* eslint-disable @typescript-eslint/no-namespace */
declare global {
  namespace Express {
    interface Request {
      loaders: Loaders;
    }
  }
}
/* eslint-enable @typescript-eslint/no-namespace */

/**
 * Middleware that creates fresh DataLoader instances for each request
 * This prevents caching issues across different requests
 */
export function dataloaderMiddleware(req: Request, _res: Response, next: NextFunction): void {
  // Create fresh loader instances for this request
  req.loaders = createLoaders();

  // Continue to the next middleware/route handler
  next();
}
