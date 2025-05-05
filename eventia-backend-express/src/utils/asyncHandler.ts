import { Request, Response, NextFunction } from 'express';
import { logger } from './logger';

/**
 * Type for request handler with required next parameter
 */
type AsyncHandlerWithNext = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<any>;

/**
 * Type for request handler with optional next parameter
 */
type AsyncHandlerWithoutNext = (
  req: Request,
  res: Response,
  next?: NextFunction
) => Promise<any>;

/**
 * Union type for both handler types
 */
type AsyncHandlerFn = AsyncHandlerWithNext | AsyncHandlerWithoutNext;

/**
 * Async handler to wrap controller methods
 * This eliminates the need for try/catch blocks in each controller
 * by catching errors and passing them to the global error handler
 * 
 * @param fn Controller function that returns a Promise
 * @returns Express middleware function
 */
export const asyncHandler = (fn: AsyncHandlerFn) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
      // Execute the handler function
      return await fn(req, res, next);
    } catch (error) {
      // Log the error
      logger.error('Unhandled error in async handler:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        path: req.path,
        method: req.method
      });
      
      // Pass to the global error handler
      next(error);
    }
  };
};