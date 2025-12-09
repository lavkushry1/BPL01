import { useEffect } from 'react';

interface ErrorCatcherProps {
  children: React.ReactNode;
}

const ErrorCatcher = ({ children }: ErrorCatcherProps) => {
  useEffect(() => {
    // Handle uncaught errors
    const errorHandler = (event: ErrorEvent) => {
      console.error('Global error caught:', event.error);
      // Prevent default browser error handling
      event.preventDefault();
    };

    // Handle unhandled promise rejections
    const rejectionHandler = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
      // Prevent default browser handling
      event.preventDefault();
    };

    // Capture React rendering errors
    const originalConsoleError = console.error;
    console.error = (...args) => {
      // Check if this is a React error
      const errorString = args.join(' ');
      if (
        errorString.includes('The above error occurred in the') ||
        errorString.includes('React will try to recreate this component tree')
      ) {
        // This is a React rendering error
        console.warn('React rendering error detected:', args);
      }
      originalConsoleError.apply(console, args);
    };

    // Add event listeners
    window.addEventListener('error', errorHandler);
    window.addEventListener('unhandledrejection', rejectionHandler);

    // Clean up
    return () => {
      window.removeEventListener('error', errorHandler);
      window.removeEventListener('unhandledrejection', rejectionHandler);
      console.error = originalConsoleError;
    };
  }, []);

  return <>{children}</>;
};

export default ErrorCatcher; 