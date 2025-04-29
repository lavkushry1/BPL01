/**
 * Simple error tracking utility for front-end errors
 */

interface ErrorInfo {
  message: string;
  stack?: string;
  componentStack?: string;
  timestamp: number;
  url: string;
}

class ErrorTracker {
  private static instance: ErrorTracker;
  private errors: ErrorInfo[] = [];
  private maxErrors = 10;
  private initialized = false;

  private constructor() {}

  public static getInstance(): ErrorTracker {
    if (!ErrorTracker.instance) {
      ErrorTracker.instance = new ErrorTracker();
    }
    return ErrorTracker.instance;
  }

  public init(): void {
    if (this.initialized) {
      return;
    }

    if (typeof window !== 'undefined') {
      // Track global errors
      window.addEventListener('error', (event) => {
        this.trackError({
          message: event.error?.message || 'Unknown error',
          stack: event.error?.stack,
          timestamp: Date.now(),
          url: window.location.href,
        });

        console.error('Global error tracked:', event.error);
      });

      // Track unhandled promise rejections
      window.addEventListener('unhandledrejection', (event) => {
        this.trackError({
          message: event.reason?.message || 'Unhandled promise rejection',
          stack: event.reason?.stack,
          timestamp: Date.now(),
          url: window.location.href,
        });

        console.error('Unhandled rejection tracked:', event.reason);
      });

      this.initialized = true;
    }
  }

  public trackError(errorInfo: ErrorInfo): void {
    // Add to beginning of array
    this.errors.unshift(errorInfo);
    
    // Limit number of stored errors
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(0, this.maxErrors);
    }

    // Store in localStorage for persistence across refreshes
    try {
      localStorage.setItem('error_tracker', JSON.stringify(this.errors));
    } catch (e) {
      // Silent fallback if localStorage is not available
    }
  }

  public getErrors(): ErrorInfo[] {
    // Try to get from localStorage first
    try {
      const storedErrors = localStorage.getItem('error_tracker');
      if (storedErrors) {
        this.errors = JSON.parse(storedErrors);
      }
    } catch (e) {
      // Silent fallback
    }
    
    return this.errors;
  }

  public clearErrors(): void {
    this.errors = [];
    try {
      localStorage.removeItem('error_tracker');
    } catch (e) {
      // Silent fallback
    }
  }
}

export const errorTracker = ErrorTracker.getInstance();

// Initialize on import
errorTracker.init(); 