import { PrismaClient, Prisma } from '@prisma/client';
import { logger } from '../utils/logger';
import { ApiError } from '../utils/apiError';

/**
 * Isolation level for transactions
 */
export enum IsolationLevel {
  // Prisma currently supports these two isolation levels
  ReadUncommitted = 'ReadUncommitted', // Lowest isolation, allows dirty reads
  ReadCommitted = 'ReadCommitted',     // Default isolation, prevents dirty reads
  // These isolation levels are supported by PostgreSQL but not directly by Prisma
  // They're included for documentation purposes
  RepeatableRead = 'RepeatableRead',   // Prevents non-repeatable reads
  Serializable = 'Serializable'        // Highest isolation, prevents phantom reads
}

/**
 * Transaction options
 */
export interface TransactionOptions {
  // Maximum wait time for the transaction to acquire locks (ms)
  maxWait?: number;
  // Maximum time for the transaction to complete (ms)
  timeout?: number;
  // Transaction isolation level
  isolationLevel?: IsolationLevel;
}

/**
 * Service to manage database transactions
 */
export class TransactionService {
  private prisma: any;

  constructor(prisma: any) {
    this.prisma = prisma;
  }

  /**
   * Execute operations within a transaction
   * @param callback Function that takes transaction client and returns a promise
   * @param options Transaction options
   * @returns Result of the callback function
   */
  async executeInTransaction<T>(
    callback: (tx: any) => Promise<T>,
    options?: TransactionOptions
  ): Promise<T> {
    try {
      // Set default options if not provided
      const txOptions: any = {
        maxWait: options?.maxWait || 5000,  // Default 5s max wait time
        timeout: options?.timeout || 30000   // Default 30s timeout
      };

      // Add isolation level if specified
      if (options?.isolationLevel) {
        // Currently, Prisma only supports ReadUncommitted and ReadCommitted
        if (options.isolationLevel === IsolationLevel.ReadUncommitted ||
            options.isolationLevel === IsolationLevel.ReadCommitted) {
          txOptions.isolationLevel = options.isolationLevel;
        } else {
          logger.warn(`Isolation level ${options.isolationLevel} not directly supported by Prisma, using default`);
        }
      }

      // Execute the callback within a transaction
      return await this.prisma.$transaction(async (tx: any) => {
        return callback(tx);
      }, txOptions);
    } catch (error) {
      // Log detailed error information
      logger.error('Transaction failed:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      
      // Map Prisma-specific errors to domain errors
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        switch (error.code) {
          case 'P2025':
            throw ApiError.notFound('Resource not found');
          case 'P2002':
            throw ApiError.conflict('Unique constraint violation');
          case 'P2003':
            throw ApiError.badRequest('Foreign key constraint violation');
          case 'P2034':
            throw ApiError.internal('Transaction aborted');
          case 'P2024':
            throw ApiError.internal('Transaction timeout occurred');
          default:
            throw ApiError.internal(`Database error: ${error.code}`);
        }
      }
      
      // For non-Prisma errors, just rethrow
      throw error;
    }
  }

  /**
   * Execute operations with automatic retries on conflicts or deadlocks
   * Useful for operations that might fail due to concurrent updates
   * 
   * @param operation Function to execute with retry logic
   * @param maxRetries Maximum number of retry attempts
   * @param baseDelay Base delay between retries in ms (will be multiplied by attempt number)
   * @returns Result of the operation
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 100
  ): Promise<T> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        // Only retry on specific errors
        const shouldRetry = this.shouldRetryOperation(error);
        
        if (shouldRetry && attempt < maxRetries) {
          // Log retry attempt
          logger.warn(`Retry attempt ${attempt}/${maxRetries}`, {
            error: error instanceof Error ? error.message : 'Unknown error',
            errorCode: error instanceof Prisma.PrismaClientKnownRequestError ? error.code : undefined
          });
          
          // Exponential backoff with jitter
          const jitter = Math.random() * 0.3 + 0.85; // Random value between 0.85 and 1.15
          const delay = Math.min(baseDelay * Math.pow(2, attempt - 1) * jitter, 5000);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        // For other errors or if max retries reached, throw immediately
        throw error;
      }
    }
    
    // If we've exhausted all retries, throw the last error
    logger.error(`Failed after ${maxRetries} retry attempts`);
    throw lastError;
  }

  /**
   * Determines if an operation should be retried based on the error
   * @param error The error that occurred
   * @returns True if the operation should be retried
   */
  private shouldRetryOperation(error: unknown): boolean {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Retry on these Prisma error codes:
      // P2002: Unique constraint violation (may be temporary if other tx rolls back)
      // P2034: Transaction failed due to conflict
      // P2024: Timed out fetching a connection from DB connection pool
      // P2028: Transaction API error (may be recoverable)
      return ['P2002', 'P2034', 'P2024', 'P2028'].includes(error.code);
    }
    
    // Retry on database connection errors
    if (error instanceof Prisma.PrismaClientRustPanicError) {
      return true;
    }
    
    // Retry on initialization errors (may be temporary)
    if (error instanceof Prisma.PrismaClientInitializationError) {
      return true;
    }
    
    return false;
  }
}

// Create and export singleton instance
import prisma from '../db/prisma';
export const transactionService = new TransactionService(prisma); 