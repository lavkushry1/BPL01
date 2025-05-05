import { Request, Response, NextFunction } from 'express';
import { createLoaders, Loaders } from '../utils/dataloader';

// Extend Express Request type to include our loaders
declare global {
  namespace Express {
    interface Request {
      loaders: Loaders;
    }
  }
}

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