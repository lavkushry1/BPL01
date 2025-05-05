import React from 'react';
import { ErrorCode } from '../../utils/errorCodes';

interface ErrorStateProps {
  error: unknown;
  title?: string;
  retry?: () => void;
  className?: string;
}

/**
 * Component for displaying error states in the UI
 * Shows different messages based on error type with retry option
 */
export const ErrorState: React.FC<ErrorStateProps> = ({
  error,
  title = 'Something went wrong',
  retry,
  className = ''
}) => {
  // Parse the error to get a user-friendly message
  const getErrorMessage = () => {
    if (typeof error === 'string') {
      return error;
    }

    // Check if it's an API error with our standard format
    if (
      typeof error === 'object' && 
      error !== null && 
      'error' in error && 
      typeof error.error === 'object' && 
      error.error !== null && 
      'message' in error.error
    ) {
      return error.error.message as string;
    }

    // Handle common error codes
    if (
      typeof error === 'object' && 
      error !== null && 
      'error' in error && 
      typeof error.error === 'object' && 
      error.error !== null && 
      'code' in error.error
    ) {
      const code = error.error.code as ErrorCode;
      
      switch (code) {
        case ErrorCode.NETWORK_ERROR:
          return 'Network error. Please check your internet connection.';
        case ErrorCode.RESOURCE_NOT_FOUND:
          return 'The requested resource was not found.';
        case ErrorCode.FORBIDDEN:
          return 'You do not have permission to access this resource.';
        case ErrorCode.NOT_AUTHENTICATED:
          return 'Please log in to continue.';
        case ErrorCode.SESSION_EXPIRED:
          return 'Your session has expired. Please log in again.';
        case ErrorCode.RATE_LIMIT_EXCEEDED:
          return 'Too many requests. Please try again later.';
        default:
          return 'An unexpected error occurred.';
      }
    }

    // Generic error message as fallback
    return 'An unexpected error occurred. Please try again later.';
  };

  return (
    <div className={`error-state p-4 rounded-md bg-red-50 text-red-800 ${className}`}>
      <h3 className="text-lg font-medium mb-2">{title}</h3>
      <p className="mb-4">{getErrorMessage()}</p>
      {retry && (
        <button
          onClick={retry}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  );
};

/**
 * Component for displaying a loading error
 */
export const LoadingError: React.FC<ErrorStateProps> = (props) => (
  <ErrorState
    {...props}
    title={props.title || 'Error loading data'}
  />
);

/**
 * Component for displaying a form submission error
 */
export const SubmissionError: React.FC<ErrorStateProps> = (props) => (
  <ErrorState
    {...props}
    title={props.title || 'Error submitting form'}
    className={`mb-4 ${props.className || ''}`}
  />
);

export default ErrorState; 