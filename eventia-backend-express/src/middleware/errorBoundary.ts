import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/apiError';
import { logger } from '../utils/logger';
import { config } from '../config';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

/**
 * Error boundary middleware
 * This acts as a wrapper for route handlers to catch all errors
 * and send appropriate responses
 * 
 * @param fn - The route handler function
 */
export const errorBoundary = (fn: Function) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Execute the route handler
      await fn(req, res, next);
    } catch (error: any) {
      logger.error('Error caught in boundary:', {
        error: error.message || String(error),
        stack: error.stack,
        path: req.path,
        method: req.method
      });

      // If headers already sent, let Express handle it
      if (res.headersSent) {
        return next(error);
      }

      // Handle different error types
      if (error instanceof ApiError) {
        // Already formatted API error
        return sendErrorResponse(res, error.statusCode, error.message, error.code, error.details);
      } 
      else if (error instanceof ZodError) {
        // Zod validation error
        const formattedErrors = error.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message,
          code: err.code
        }));
        return sendErrorResponse(res, 400, 'Validation failed', 'VALIDATION_ERROR', formattedErrors);
      }
      else if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Prisma database error
        return handlePrismaError(res, error);
      }
      else if (error.name === 'JsonWebTokenError') {
        // JWT error
        return sendErrorResponse(res, 401, 'Invalid token', 'INVALID_TOKEN');
      }
      else if (error.name === 'TokenExpiredError') {
        // JWT expiration error
        return sendErrorResponse(res, 401, 'Token expired', 'TOKEN_EXPIRED');
      }
      
      // Default server error
      return sendErrorResponse(res, 500, 'Internal Server Error', 'INTERNAL_SERVER_ERROR');
    }
  };
};

/**
 * Handle Prisma database errors
 */
const handlePrismaError = (res: Response, error: Prisma.PrismaClientKnownRequestError) => {
  switch (error.code) {
    case 'P2002': // Unique constraint violation
      return sendErrorResponse(
        res, 
        409, 
        'A record with the provided values already exists', 
        'UNIQUE_CONSTRAINT_VIOLATION',
        { fields: (error.meta?.target as string[]) || [] }
      );
    
    case 'P2003': // Foreign key constraint violation
      return sendErrorResponse(
        res, 
        400, 
        'Referenced record not found', 
        'FOREIGN_KEY_CONSTRAINT_VIOLATION'
      );
      
    case 'P2025': // Record not found
      return sendErrorResponse(
        res, 
        404, 
        'Record not found', 
        'RECORD_NOT_FOUND'
      );
      
    default:
      return sendErrorResponse(
        res, 
        500, 
        'Database error', 
        'DATABASE_ERROR'
      );
  }
};

/**
 * Send standardized error response
 */
const sendErrorResponse = (
  res: Response, 
  statusCode: number, 
  message: string, 
  code: string, 
  details: any = null
) => {
  const response: any = {
    status: 'error',
    code,
    message
  };
  
  // Add details if available
  if (details) {
    response.errors = details;
  }
  
  // Add stack trace in development
  if (config.isDevelopment) {
    response.stack = new Error().stack;
  }
  
  return res.status(statusCode).json(response);
}; 