import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { ApiError } from '../utils/apiError';
import { Knex } from 'knex';

// Define the extended request type with db property
export interface DatabaseRequest extends Request {
  db: Knex;
}

/**
 * Middleware to add the database connection to the request object
 * This allows controllers to access the database without importing it directly
 */
export const databaseMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    // Attach database instance to request
    (req as DatabaseRequest).db = db;
    next();
  } catch (error) {
    next(ApiError.internal('Database middleware error'));
  }
}; 