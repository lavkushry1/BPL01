import React from 'react';
import { ApiErrorResponse } from '../../services/api/apiClient';

export interface FormErrorProps {
  error?: string | null;
  fieldErrors?: Record<string, string> | null;
  apiError?: ApiErrorResponse | null;
  className?: string;
  fieldErrorClassName?: string;
}

/**
 * FormError component for displaying validation errors
 * Can display a general error message, field-specific errors, and API errors
 */
export const FormError: React.FC<FormErrorProps> = ({
  error,
  fieldErrors,
  apiError,
  className = "text-red-500 text-sm mt-1",
  fieldErrorClassName = "text-red-500 text-xs mt-1 mb-1"
}) => {
  // Return null if no errors
  if (!error && (!fieldErrors || Object.keys(fieldErrors).length === 0) && !apiError) {
    return null;
  }

  // Convert API error to readable format if present
  const apiErrorMessage = apiError?.error?.message || null;
  
  return (
    <div className="form-error-container">
      {/* Main error message */}
      {(error || apiErrorMessage) && (
        <div className={className}>
          {error || apiErrorMessage}
        </div>
      )}
      
      {/* Field-specific errors */}
      {fieldErrors && Object.keys(fieldErrors).length > 0 && (
        <ul className="list-disc pl-5 mt-1">
          {Object.entries(fieldErrors).map(([field, message]) => (
            <li key={field} className={fieldErrorClassName}>
              {message}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

/**
 * FieldError component for displaying errors for specific form fields
 */
export const FieldError: React.FC<{ error?: string | null }> = ({ error }) => {
  if (!error) return null;
  
  return (
    <div className="text-red-500 text-xs mt-1">
      {error}
    </div>
  );
};

export default FormError; 