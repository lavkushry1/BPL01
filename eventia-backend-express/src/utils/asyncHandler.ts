import { Request, Response, NextFunction } from 'express';

/**
 * Async handler to wrap controller methods
 * This eliminates the need for try/catch blocks in each controller
 * by catching errors and passing them to the global error handler
 * 
 * @param fn Controller function that returns a Promise
 * @returns Express middleware function
 */
export const asyncHandler = 
  (fn: (req: Request, res: Response, next?: NextFunction) => Promise<any>) => 
  (req: Request, res: Response, next: NextFunction): Promise<void> => {
    return Promise.resolve(fn(req, res, next))
      .catch((error) => {
        next(error);
      });
  };