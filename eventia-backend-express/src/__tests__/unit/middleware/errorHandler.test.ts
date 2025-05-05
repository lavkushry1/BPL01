import { Request, Response, NextFunction } from 'express';
import { errorHandler } from '../../../middleware/errorHandler';
import { ApiError } from '../../../utils/apiError';
import { ErrorCode } from '../../../utils/errorCodes';
import { Prisma } from '@prisma/client';

// Mock logger
jest.mock('../../../utils/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  },
}));

describe('Error Handler Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {
      method: 'GET',
      path: '/test',
      user: { id: 'test-user' },
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    nextFunction = jest.fn();
  });

  it('should handle ApiError properly', () => {
    const apiError = new ApiError(400, 'Bad Request', 'BAD_REQUEST');
    
    errorHandler(
      apiError, 
      mockRequest as Request, 
      mockResponse as Response, 
      nextFunction
    );

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'BAD_REQUEST',
        message: 'Bad Request',
      },
      data: null,
    });
  });

  it('should handle Prisma unique constraint error (P2002)', () => {
    const prismaError = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
      code: 'P2002',
      clientVersion: '1.0.0',
      meta: {},
    });

    errorHandler(
      prismaError,
      mockRequest as Request,
      mockResponse as Response,
      nextFunction
    );

    expect(mockResponse.status).toHaveBeenCalledWith(409);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: ErrorCode.DUPLICATE_RESOURCE,
        message: 'A resource with this identifier already exists',
      },
      data: null,
    });
  });

  it('should handle Prisma not found error (P2025)', () => {
    const prismaError = new Prisma.PrismaClientKnownRequestError('Record not found', {
      code: 'P2025',
      clientVersion: '1.0.0',
      meta: {},
    });

    errorHandler(
      prismaError,
      mockRequest as Request,
      mockResponse as Response,
      nextFunction
    );

    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: ErrorCode.RESOURCE_NOT_FOUND,
        message: 'The requested resource was not found',
      },
      data: null,
    });
  });

  it('should handle Prisma foreign key error (P2003)', () => {
    const prismaError = new Prisma.PrismaClientKnownRequestError('Foreign key constraint failed', {
      code: 'P2003',
      clientVersion: '1.0.0',
      meta: {},
    });

    errorHandler(
      prismaError,
      mockRequest as Request,
      mockResponse as Response,
      nextFunction
    );

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: ErrorCode.INVALID_INPUT,
        message: 'Invalid reference to a related resource',
      },
      data: null,
    });
  });

  it('should handle unknown Prisma error and log it', () => {
    const { logger } = require('../../../utils/logger');
    const prismaError = new Prisma.PrismaClientKnownRequestError('Unknown Prisma error', {
      code: 'P9999', // Unknown code
      clientVersion: '1.0.0',
      meta: {},
    });

    errorHandler(
      prismaError,
      mockRequest as Request,
      mockResponse as Response,
      nextFunction
    );

    expect(logger.warn).toHaveBeenCalledWith('Unhandled Prisma error code: P9999');
    expect(mockResponse.status).toHaveBeenCalledWith(500);
  });

  it('should handle ZodError as validation error', () => {
    const zodError = new Error('Validation failed');
    zodError.name = 'ZodError';

    errorHandler(
      zodError,
      mockRequest as Request,
      mockResponse as Response,
      nextFunction
    );

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Validation error',
        details: 'Validation failed',
      },
      data: null,
    });
  });

  it('should handle JWT JsonWebTokenError', () => {
    const jwtError = new Error('Invalid signature');
    jwtError.name = 'JsonWebTokenError';

    errorHandler(
      jwtError,
      mockRequest as Request,
      mockResponse as Response,
      nextFunction
    );

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: ErrorCode.INVALID_TOKEN,
        message: 'Invalid token',
      },
      data: null,
    });
  });

  it('should handle JWT TokenExpiredError', () => {
    const jwtError = new Error('Token expired');
    jwtError.name = 'TokenExpiredError';

    errorHandler(
      jwtError,
      mockRequest as Request,
      mockResponse as Response,
      nextFunction
    );

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: ErrorCode.TOKEN_EXPIRED,
        message: 'Token has expired',
      },
      data: null,
    });
  });

  it('should handle generic errors with default 500 response', () => {
    const genericError = new Error('Unexpected error');

    // Mock process.env.NODE_ENV
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    errorHandler(
      genericError,
      mockRequest as Request,
      mockResponse as Response,
      nextFunction
    );

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: ErrorCode.INTERNAL_ERROR,
        message: 'Unexpected error',
      },
      data: null,
    });

    // Reset NODE_ENV
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('should hide error details in production environment', () => {
    const genericError = new Error('Detailed error that should be hidden');

    // Mock process.env.NODE_ENV
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    errorHandler(
      genericError,
      mockRequest as Request,
      mockResponse as Response,
      nextFunction
    );

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: ErrorCode.INTERNAL_ERROR,
        message: 'An unexpected error occurred',
      },
      data: null,
    });

    // Reset NODE_ENV
    process.env.NODE_ENV = originalNodeEnv;
  });
}); 