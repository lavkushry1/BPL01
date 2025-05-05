import React from 'react';
import { Info } from 'lucide-react';

/**
 * Error Message Component
 * Displays an error message when seat map loading fails
 */
interface ErrorMessageProps {
  message: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => {
  return (
    <div className="p-4 bg-red-50 border border-red-200 rounded-md">
      <div className="flex items-start">
        <Info className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
        <div>
          <h3 className="font-medium text-red-800">Error loading seat map</h3>
          <p className="text-sm text-red-700">{message}</p>
        </div>
      </div>
    </div>
  );
};

export default ErrorMessage; 