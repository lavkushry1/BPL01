"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withRetry = withRetry;
const logger_1 = require("./logger");
/**
 * Default retry options
 */
const defaultOptions = {
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
async function withRetry(operation, options) {
    const retryOptions = { ...defaultOptions, ...options };
    const { maxAttempts, delay, backoff, maxDelay, onRetry } = retryOptions;
    let attempts = 0;
    let lastError;
    while (attempts < maxAttempts) {
        try {
            return await operation();
        }
        catch (error) {
            attempts++;
            lastError = error instanceof Error ? error : new Error(String(error));
            if (attempts >= maxAttempts) {
                // We've reached maximum retries, propagate the error
                logger_1.logger.error(`Operation failed after ${attempts} attempts: ${lastError.message}`);
                throw lastError;
            }
            // Calculate next delay with exponential backoff if enabled
            const nextDelay = backoff
                ? Math.min(delay * Math.pow(2, attempts - 1), maxDelay || Number.MAX_SAFE_INTEGER)
                : delay;
            logger_1.logger.warn(`Attempt ${attempts} failed, retrying in ${nextDelay}ms: ${lastError.message}`);
            // Call the onRetry callback if provided
            if (onRetry) {
                try {
                    onRetry(attempts, lastError);
                }
                catch (callbackError) {
                    logger_1.logger.warn('Error in retry callback:', callbackError);
                }
            }
            // Wait before next attempt
            await new Promise(resolve => setTimeout(resolve, nextDelay));
        }
    }
    // This should never happen due to the throw inside the loop
    throw new Error('Unexpected error in retry mechanism');
}
