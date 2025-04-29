import { logger } from './logger';

/**
 * Options for the retry mechanism
 */
interface RetryOptions {
  maxAttempts: number;
  delay: number;
  backoff: boolean;
  maxDelay?: number;
  onRetry?: (attempt: number, error: Error) => void;
}

/**
 * Default retry options
 */
const defaultOptions: RetryOptions = {
  maxAttempts: 3,
  delay: 300,
  backoff: true,
  maxDelay: 3000,
  onRetry: undefined
};

/**
 * A utility to retry async operations with configurable backoff
 * @param operation The async function to retry
 * @param options Retry options
 * @returns The result of the operation
 * @throws The last error encountered after all retry attempts
 */
export async function withRetry<T>(
  operation: () => Promise<T>, 
  options: Partial<RetryOptions>
): Promise<T> {
  const retryOptions = { ...defaultOptions, ...options };
  const {
    maxAttempts,
    delay,
    backoff,
    maxDelay,
    onRetry
  } = retryOptions;

  let attempts = 0;
  let lastError: Error;

  while (attempts < maxAttempts) {
    try {
      return await operation();
    } catch (error) {
      attempts++;
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempts >= maxAttempts) {
        // We've reached maximum retries, propagate the error
        logger.error(`Operation failed after ${attempts} attempts: ${lastError.message}`);
        throw lastError;
      }

      // Calculate next delay with exponential backoff if enabled
      const nextDelay = backoff 
        ? Math.min(delay * Math.pow(2, attempts - 1), maxDelay || Number.MAX_SAFE_INTEGER)
        : delay;

      logger.warn(`Attempt ${attempts} failed, retrying in ${nextDelay}ms: ${lastError.message}`);

      // Call the onRetry callback if provided
      if (onRetry) {
        try {
          onRetry(attempts, lastError);
        } catch (callbackError) {
          logger.warn('Error in retry callback:', callbackError);
        }
      }

      // Wait before next attempt
      await new Promise(resolve => setTimeout(resolve, nextDelay));
    }
  }

  // This should never happen due to the throw inside the loop
  throw new Error('Unexpected error in retry mechanism');
}