import { PrismaClient, Prisma } from '@prisma/client';
import { TransactionService, IsolationLevel } from '../../../services/transaction.service';
import { ApiError } from '../../../utils/apiError';

// Mock Prisma
jest.mock('@prisma/client', () => {
  const mockPrismaClient = {
    $transaction: jest.fn(),
  };
  
  return {
    PrismaClient: jest.fn(() => mockPrismaClient),
    Prisma: {
      TransactionClient: jest.fn(),
      PrismaClientKnownRequestError: class PrismaClientKnownRequestError extends Error {
        code: string;
        constructor(message: string, { code }: { code: string }) {
          super(message);
          this.name = 'PrismaClientKnownRequestError';
          this.code = code;
        }
      },
      PrismaClientRustPanicError: class PrismaClientRustPanicError extends Error {
        constructor(message: string) {
          super(message);
          this.name = 'PrismaClientRustPanicError';
        }
      },
      PrismaClientInitializationError: class PrismaClientInitializationError extends Error {
        constructor(message: string) {
          super(message);
          this.name = 'PrismaClientInitializationError';
        }
      },
    }
  };
});

// Mock logger
jest.mock('../../../utils/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  },
}));

describe('TransactionService', () => {
  let prisma: jest.Mocked<PrismaClient>;
  let transactionService: TransactionService;
  
  beforeEach(() => {
    jest.clearAllMocks();
    prisma = new PrismaClient() as jest.Mocked<PrismaClient>;
    transactionService = new TransactionService(prisma);
  });
  
  describe('executeInTransaction', () => {
    it('should execute callback in a transaction with default options', async () => {
      // Setup
      const mockResult = { id: 'test-123' };
      const mockCallback = jest.fn().mockResolvedValue(mockResult);
      prisma.$transaction.mockImplementation(async (callback) => callback(prisma as any));
      
      // Act
      const result = await transactionService.executeInTransaction(mockCallback);
      
      // Assert
      expect(result).toEqual(mockResult);
      expect(mockCallback).toHaveBeenCalled();
      expect(prisma.$transaction).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          maxWait: 5000,
          timeout: 30000
        })
      );
    });
    
    it('should pass custom transaction options', async () => {
      // Setup
      const mockResult = { id: 'test-123' };
      const mockCallback = jest.fn().mockResolvedValue(mockResult);
      prisma.$transaction.mockImplementation(async (callback) => callback(prisma as any));
      
      const options = {
        maxWait: 10000,
        timeout: 60000,
        isolationLevel: IsolationLevel.ReadCommitted
      };
      
      // Act
      const result = await transactionService.executeInTransaction(mockCallback, options);
      
      // Assert
      expect(result).toEqual(mockResult);
      expect(mockCallback).toHaveBeenCalled();
      expect(prisma.$transaction).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          maxWait: 10000,
          timeout: 60000,
          isolationLevel: IsolationLevel.ReadCommitted
        })
      );
    });
    
    it('should log a warning for unsupported isolation levels', async () => {
      // Setup
      const { logger } = require('../../../utils/logger');
      const mockResult = { id: 'test-123' };
      const mockCallback = jest.fn().mockResolvedValue(mockResult);
      prisma.$transaction.mockImplementation(async (callback) => callback(prisma as any));
      
      const options = {
        isolationLevel: IsolationLevel.Serializable
      };
      
      // Act
      await transactionService.executeInTransaction(mockCallback, options);
      
      // Assert
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Isolation level Serializable not directly supported by Prisma')
      );
    });
    
    it('should map Prisma error P2025 to NotFound error', async () => {
      // Setup
      const mockCallback = jest.fn();
      const prismaError = new Prisma.PrismaClientKnownRequestError('Record not found', { 
        code: 'P2025',
        clientVersion: '1.0.0',
        meta: {}
      });
      
      prisma.$transaction.mockImplementation(() => {
        throw prismaError;
      });
      
      // Act & Assert
      await expect(transactionService.executeInTransaction(mockCallback))
        .rejects.toThrow(ApiError);
      
      await expect(transactionService.executeInTransaction(mockCallback))
        .rejects.toHaveProperty('statusCode', 404);
    });
    
    it('should map Prisma error P2002 to Conflict error', async () => {
      // Setup
      const mockCallback = jest.fn();
      const prismaError = new Prisma.PrismaClientKnownRequestError('Unique constraint violation', { 
        code: 'P2002',
        clientVersion: '1.0.0',
        meta: {}
      });
      
      prisma.$transaction.mockImplementation(() => {
        throw prismaError;
      });
      
      // Act & Assert
      await expect(transactionService.executeInTransaction(mockCallback))
        .rejects.toThrow(ApiError);
      
      await expect(transactionService.executeInTransaction(mockCallback))
        .rejects.toHaveProperty('statusCode', 409);
    });
  });
  
  describe('executeWithRetry', () => {
    it('should execute operation successfully on first try', async () => {
      // Setup
      const mockResult = { id: 'test-123' };
      const operation = jest.fn().mockResolvedValue(mockResult);
      
      // Act
      const result = await transactionService.executeWithRetry(operation);
      
      // Assert
      expect(result).toEqual(mockResult);
      expect(operation).toHaveBeenCalledTimes(1);
    });
    
    it('should retry operation on retryable error and succeed', async () => {
      // Setup
      const mockResult = { id: 'test-123' };
      const prismaError = new Prisma.PrismaClientKnownRequestError('Transaction failed', { 
        code: 'P2034',
        clientVersion: '1.0.0',
        meta: {}
      });
      
      const operation = jest.fn()
        .mockRejectedValueOnce(prismaError)
        .mockResolvedValueOnce(mockResult);
      
      // Mock setTimeout to avoid waiting in tests
      jest.spyOn(global, 'setTimeout').mockImplementation((callback: any) => {
        callback();
        return {} as any;
      });
      
      // Act
      const result = await transactionService.executeWithRetry(operation);
      
      // Assert
      expect(result).toEqual(mockResult);
      expect(operation).toHaveBeenCalledTimes(2);
    });
    
    it('should give up after max retries and throw the last error', async () => {
      // Setup
      const prismaError = new Prisma.PrismaClientKnownRequestError('Transaction failed', { 
        code: 'P2034',
        clientVersion: '1.0.0',
        meta: {}
      });
      
      const operation = jest.fn().mockRejectedValue(prismaError);
      
      // Mock setTimeout to avoid waiting in tests
      jest.spyOn(global, 'setTimeout').mockImplementation((callback: any) => {
        callback();
        return {} as any;
      });
      
      // Act & Assert
      await expect(transactionService.executeWithRetry(operation, 3))
        .rejects.toThrow(prismaError);
      
      expect(operation).toHaveBeenCalledTimes(3);
    });
    
    it('should not retry on non-retryable errors', async () => {
      // Setup
      const nonRetryableError = new Error('Generic error');
      const operation = jest.fn().mockRejectedValue(nonRetryableError);
      
      // Act & Assert
      await expect(transactionService.executeWithRetry(operation))
        .rejects.toThrow(nonRetryableError);
      
      expect(operation).toHaveBeenCalledTimes(1);
    });
  });
  
  describe('shouldRetryOperation (private method testing via executeWithRetry)', () => {
    it('should retry on PrismaClientKnownRequestError with specified error codes', async () => {
      // Setup
      const errorCodes = ['P2002', 'P2034', 'P2024', 'P2028'];
      
      for (const code of errorCodes) {
        const prismaError = new Prisma.PrismaClientKnownRequestError('Test error', { 
          code,
          clientVersion: '1.0.0',
          meta: {}
        });
        
        const operation = jest.fn()
          .mockRejectedValueOnce(prismaError)
          .mockResolvedValueOnce('success');
        
        // Mock setTimeout to avoid waiting in tests
        jest.spyOn(global, 'setTimeout').mockImplementation((callback: any) => {
          callback();
          return {} as any;
        });
        
        // Act
        await transactionService.executeWithRetry(operation);
        
        // Assert
        expect(operation).toHaveBeenCalledTimes(2);
      }
    });
    
    it('should retry on PrismaClientRustPanicError', async () => {
      // Setup
      const rustPanicError = new Prisma.PrismaClientRustPanicError('Rust panic occurred', '5.0.0');
      
      const operation = jest.fn()
        .mockRejectedValueOnce(rustPanicError)
        .mockResolvedValueOnce('success');
      
      // Mock setTimeout to avoid waiting in tests
      jest.spyOn(global, 'setTimeout').mockImplementation((callback: any) => {
        callback();
        return {} as any;
      });
      
      // Act
      await transactionService.executeWithRetry(operation);
      
      // Assert
      expect(operation).toHaveBeenCalledTimes(2);
    });
    
    it('should retry on PrismaClientInitializationError', async () => {
      // Setup
      const initError = new Prisma.PrismaClientInitializationError('Failed to initialize Prisma Client', '5.0.0');
      
      const operation = jest.fn()
        .mockRejectedValueOnce(initError)
        .mockResolvedValueOnce('success');
      
      // Mock setTimeout to avoid waiting in tests
      jest.spyOn(global, 'setTimeout').mockImplementation((callback: any) => {
        callback();
        return {} as any;
      });
      
      // Act
      await transactionService.executeWithRetry(operation);
      
      // Assert
      expect(operation).toHaveBeenCalledTimes(2);
    });
  });
});