/**
 * API Error Handling Utilities
 */
import { ApiError } from './types';

// Error code constants
export const ErrorCodes = {
  // Authentication errors
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  
  // Request errors
  BAD_REQUEST: 'BAD_REQUEST',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  
  // Server errors
  SERVER_ERROR: 'SERVER_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  
  // Business logic errors
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  BOOKING_FAILED: 'BOOKING_FAILED',
  SOLD_OUT: 'SOLD_OUT',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
};

/**
 * Check if response is an API error
 */
export const isApiError = (error: any): error is ApiError => {
  return (
    error &&
    typeof error === 'object' &&
    'status' in error &&
    'code' in error &&
    'message' in error
  );
};

/**
 * Standard error handler that logs errors and formats them for display
 */
export const handleApiError = (error: unknown): ApiError => {
  // If it's already an ApiError, return it
  if (isApiError(error)) {
    return error;
  }

  // If it's an Error instance
  if (error instanceof Error) {
    return {
      status: 500,
      code: ErrorCodes.SERVER_ERROR,
      message: error.message || 'An unknown error occurred',
    };
  }

  // For anything else
  return {
    status: 500,
    code: ErrorCodes.SERVER_ERROR,
    message: 'An unknown error occurred',
  };
};

/**
 * Log API error for debugging
 */
export const logApiError = (error: unknown): void => {
  if (process.env.NODE_ENV !== 'production') {
    console.error('API Error:', error);
  }
  
  // In production, you might want to send errors to a monitoring service
  if (process.env.NODE_ENV === 'production') {
    // Example: Send to error monitoring service
    // errorMonitoringService.captureException(error);
  }
}; 