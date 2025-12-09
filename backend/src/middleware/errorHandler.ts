import { Prisma } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../utils/apiError';
import { ErrorCode } from '../utils/errorCodes';
import { logger } from '../utils/logger';

/**
 * Global error handler middleware
 * Processes all errors and returns standardized error responses
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  // Log the error
  logger.error({
    message: `[${req.method}] ${req.path} - ${err.message}`,
    error: err.stack,
    requestId: (req as any).id || 'unknown',
    userId: req.user?.id || 'anonymous'
  });

  // Handle ApiError instances
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details
      },
      data: null
    });
  }

  // Handle Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002': // Unique constraint violation
        return res.status(409).json({
          success: false,
          error: {
            code: ErrorCode.DUPLICATE_RESOURCE,
            message: 'A resource with this identifier already exists'
          },
          data: null
        });
      case 'P2025': // Record not found
        return res.status(404).json({
          success: false,
          error: {
            code: ErrorCode.RESOURCE_NOT_FOUND,
            message: 'The requested resource was not found'
          },
          data: null
        });
      case 'P2003': // Foreign key constraint failed
        return res.status(400).json({
          success: false,
          error: {
            code: ErrorCode.INVALID_INPUT,
            message: 'Invalid reference to a related resource'
          },
          data: null
        });
      default:
        // Log the unknown Prisma error code for future handling
        logger.warn(`Unhandled Prisma error code: ${err.code}`);
    }
  }

  // Handle validation errors (like Zod errors)
  if (err.name === 'ZodError') {
    return res.status(400).json({
      success: false,
      error: {
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Validation error',
        details: err.message
      },
      data: null
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: {
        code: ErrorCode.INVALID_TOKEN,
        message: 'Invalid token'
      },
      data: null
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: {
        code: ErrorCode.TOKEN_EXPIRED,
        message: 'Token has expired'
      },
      data: null
    });
  }

  // Default error response for unexpected errors
  return res.status(500).json({
    success: false,
    error: {
      code: ErrorCode.INTERNAL_ERROR,
      message: process.env.NODE_ENV === 'production'
        ? 'An unexpected error occurred'
        : err.message || 'Unknown error'
    },
    data: null
  });
};
