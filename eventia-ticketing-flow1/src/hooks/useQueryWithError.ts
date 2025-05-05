import { useQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { ApiErrorResponse, logError } from '../services/api/apiClient';
import { ErrorCode } from '../utils/errorCodes';

/**
 * Helper for handling API errors in query operations
 */
export const handleQueryError = (error: unknown, context?: Record<string, any>) => {
  // Log the error
  logError(error, { ...context, type: 'query_error' });

  // Check for authentication errors
  const errorCode = (error as ApiErrorResponse)?.error?.code;
  if (errorCode === ErrorCode.SESSION_EXPIRED || errorCode === ErrorCode.TOKEN_EXPIRED) {
    // Redirect to login if not already there
    if (window.location.pathname !== '/login') {
      window.location.href = '/login?reason=session_expired';
    }
  }
};

/**
 * Hook for handling API errors in mutation operations
 * To be used with useMutation from React Query
 */
export const handleMutationError = (error: unknown, context?: Record<string, any>): string => {
  // Log the error
  logError(error, { ...context, type: 'mutation_error' });

  // Extract error message for display
  if ((error as ApiErrorResponse)?.error?.message) {
    return (error as ApiErrorResponse).error.message;
  }

  if ((error as AxiosError)?.message) {
    return (error as AxiosError).message;
  }

  return 'An unexpected error occurred';
};

/**
 * Example usage of error handler with React Query:
 * 
 * // In a component:
 * const { data, error, isLoading } = useQuery(['users'], fetchUsers, {
 *   onError: (err) => handleQueryError(err, { queryKey: 'users' })
 * });
 */ 