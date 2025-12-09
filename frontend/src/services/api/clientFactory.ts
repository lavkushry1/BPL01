/**
 * @file clientFactory.ts
 * @description Centralized client exports that now defer to the cookie-aware defaultApiClient.
 */

import { defaultApiClient, API_URL, WS_URL } from './apiUtils';
import { ApiError } from './types';
import axios from 'axios';

/**
 * Log API error for debugging
 */
export const logApiError = (error: unknown): void => {
  if (import.meta.env.MODE !== 'production') {
    console.error('API Error:', error);
  }
};

/**
 * Standard error handler that formats errors for display
 */
export const handleApiError = (error: unknown): ApiError => {
  // If it's an AxiosError
  if (axios.isAxiosError(error)) {
    return {
      status: error.response?.status || 500,
      code: (error.response?.data as any)?.code || 'UNKNOWN_ERROR',
      message: (error.response?.data as any)?.message || error.message || 'An unknown error occurred',
      details: (error.response?.data as any)?.details || undefined
    };
  }

  // If it's an Error instance
  if (error instanceof Error) {
    return {
      status: 500,
      code: 'SERVER_ERROR',
      message: error.message || 'An unknown error occurred',
    };
  }

  // For anything else
  return {
    status: 500,
    code: 'SERVER_ERROR',
    message: 'An unknown error occurred',
  };
};

// Preserve API for legacy imports while routing everything through defaultApiClient
export const createApiClient = () => defaultApiClient;
export const apiClient = defaultApiClient;

export { API_URL, WS_URL };
