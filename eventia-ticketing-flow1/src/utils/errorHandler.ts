/**
 * @file errorHandler.ts
 * @description Standardized error handling utilities for API requests
 */
import axios from 'axios';

/**
 * Standard error response format
 */
export interface ApiError {
  code: number;
  message: string;
  details?: Record<string, any>;
}

/**
 * Handles API errors in a standardized way
 * Converts various error types into a consistent format
 * 
 * @param error Any error object thrown during API calls
 * @returns Standardized error object
 */
export function handleApiError(error: unknown): ApiError {
  // Handle Axios errors
  if (axios.isAxiosError(error)) {
    return {
      code: error.response?.status || 500,
      message: error.response?.data?.message || 'Network Error',
      details: error.response?.data?.details || {}
    };
  }
  
  // Handle standard Error objects
  if (error instanceof Error) {
    return {
      code: 500,
      message: error.message || 'Unknown error occurred',
      details: { name: error.name }
    };
  }
  
  // Default case for unknown error types
  return { 
    code: 500, 
    message: 'Unknown error occurred' 
  };
}

/**
 * Helper to display user-friendly error messages
 * Handles common error codes with appropriate messages
 * 
 * @param error ApiError object
 * @returns User-friendly error message
 */
export function getUserFriendlyErrorMessage(error: ApiError): string {
  switch (error.code) {
    case 400:
      return 'Invalid request. Please check your inputs and try again.';
    case 401:
      return 'Your session has expired. Please log in again.';
    case 403:
      return 'You do not have permission to perform this action.';
    case 404:
      return 'The requested resource could not be found.';
    case 409:
      return 'This operation could not be completed due to a conflict.';
    case 429:
      return 'Too many requests. Please try again later.';
    case 500:
    case 502:
    case 503:
    case 504:
      return 'Server error. Please try again later.';
    default:
      return error.message || 'An unexpected error occurred.';
  }
}

/**
 * Check if an error should trigger automatic session refresh/logout
 * 
 * @param error ApiError object
 * @returns Boolean indicating if auth refresh is required
 */
export function isAuthError(error: ApiError): boolean {
  return error.code === 401;
} 