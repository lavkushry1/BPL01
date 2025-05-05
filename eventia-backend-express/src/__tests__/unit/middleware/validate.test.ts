import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate, clearValidationCache, customValidation } from '../../../middleware/validate';
import { ApiError } from '../../../utils/apiError';

describe('Validation Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: jest.Mock;

  beforeEach(() => {
    mockRequest = {
      body: {},
      query: {},
      params: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    nextFunction = jest.fn();
    
    // Clear validation cache before each test
    clearValidationCache();
  });

  describe('validate middleware', () => {
    it('should validate request data successfully', async () => {
      // Setup schema
      const schema = z.object({
        body: z.object({
          name: z.string().min(3),
          email: z.string().email(),
        }),
        query: z.object({}),
        params: z.object({}),
      });

      // Setup request data
      mockRequest.body = {
        name: 'Test User',
        email: 'test@example.com',
      };

      // Apply middleware
      const middleware = validate(schema);
      await middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      // Assert
      expect(nextFunction).toHaveBeenCalledWith();
      expect(nextFunction).not.toHaveBeenCalledWith(expect.any(ApiError));
    });

    it('should sanitize input data by trimming strings', async () => {
      // Setup schema
      const schema = z.object({
        body: z.object({
          name: z.string(),
          email: z.string(),
        }),
        query: z.object({}),
        params: z.object({}),
      });

      // Setup request data with whitespace
      mockRequest.body = {
        name: '  Test User  ',
        email: ' test@example.com ',
      };

      // Apply middleware
      const middleware = validate(schema);
      await middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      // Assert
      expect(mockRequest.body.name).toBe('Test User');
      expect(mockRequest.body.email).toBe('test@example.com');
      expect(nextFunction).toHaveBeenCalledWith();
    });

    it('should sanitize nested objects', async () => {
      // Setup schema
      const schema = z.object({
        body: z.object({
          user: z.object({
            name: z.string(),
            contact: z.object({
              email: z.string(),
            }),
          }),
        }),
        query: z.object({}),
        params: z.object({}),
      });

      // Setup request data with whitespace
      mockRequest.body = {
        user: {
          name: '  Test User  ',
          contact: {
            email: ' test@example.com ',
          },
        },
      };

      // Apply middleware
      const middleware = validate(schema);
      await middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      // Assert
      expect(mockRequest.body.user.name).toBe('Test User');
      expect(mockRequest.body.user.contact.email).toBe('test@example.com');
      expect(nextFunction).toHaveBeenCalledWith();
    });

    it('should handle arrays correctly', async () => {
      // Setup schema
      const schema = z.object({
        body: z.object({
          tags: z.array(z.string()),
        }),
        query: z.object({}),
        params: z.object({}),
      });

      // Setup request data with whitespace
      mockRequest.body = {
        tags: ['  tag1  ', 'tag2', '  tag3 '],
      };

      // Apply middleware
      const middleware = validate(schema);
      await middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      // Assert
      expect(mockRequest.body.tags[0]).toBe('tag1');
      expect(mockRequest.body.tags[2]).toBe('tag3');
      expect(nextFunction).toHaveBeenCalledWith();
    });

    it('should handle validation errors', async () => {
      // Setup schema
      const schema = z.object({
        body: z.object({
          name: z.string().min(3),
          email: z.string().email(),
        }),
        query: z.object({}),
        params: z.object({}),
      });

      // Setup invalid request data
      mockRequest.body = {
        name: 'Te', // Less than 3 chars
        email: 'invalid-email',
      };

      // Apply middleware
      const middleware = validate(schema);
      await middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      // Assert error
      expect(nextFunction).toHaveBeenCalledWith(expect.any(ApiError));
      const error = nextFunction.mock.calls[0][0] as ApiError;
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('VALIDATION_ERROR');
      
      // Check if the error details contain both validation issues
      const details = error.details;
      expect(details).toBeInstanceOf(Array);
      expect(details.some(d => d.path === 'body.name')).toBe(true);
      expect(details.some(d => d.path === 'body.email')).toBe(true);
    });

    it('should handle validation with query parameters', async () => {
      // Setup schema
      const schema = z.object({
        body: z.object({}),
        query: z.object({
          page: z.string().refine(val => !isNaN(Number(val)), {
            message: 'Page must be a number',
          }),
          limit: z.string().refine(val => !isNaN(Number(val)), {
            message: 'Limit must be a number',
          }),
        }),
        params: z.object({}),
      });

      // Setup request data
      mockRequest.query = {
        page: '1',
        limit: '10',
      };

      // Apply middleware
      const middleware = validate(schema);
      await middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      // Assert
      expect(nextFunction).toHaveBeenCalledWith();
    });

    it('should handle validation with path parameters', async () => {
      // Setup schema
      const schema = z.object({
        body: z.object({}),
        query: z.object({}),
        params: z.object({
          id: z.string().uuid(),
        }),
      });

      // Setup request data
      mockRequest.params = {
        id: '123e4567-e89b-12d3-a456-426614174000',
      };

      // Apply middleware
      const middleware = validate(schema);
      await middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      // Assert
      expect(nextFunction).toHaveBeenCalledWith();
    });

    it('should cache validation results when provided a cache key', async () => {
      // Setup schema
      const schema = z.object({
        body: z.object({
          name: z.string(),
        }),
        query: z.object({}),
        params: z.object({}),
      });

      // Setup request data
      mockRequest.body = {
        name: 'Test User',
      };

      // Apply middleware with caching
      const middleware = validate(schema, 'test-cache-key');
      
      // First call
      await middleware(mockRequest as Request, mockResponse as Response, nextFunction);
      
      // Reset mock to check second call
      nextFunction.mockReset();
      
      // Second call with same data should use cache
      await middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      // Assert
      expect(nextFunction).toHaveBeenCalledWith();
      expect(nextFunction).not.toHaveBeenCalledWith(expect.any(ApiError));
    });
  });

  describe('customValidation', () => {
    it('should not throw error when condition is true', () => {
      expect(() => customValidation(true, 'No error')).not.toThrow();
    });

    it('should throw ZodError when condition is false', () => {
      expect(() => customValidation(false, 'Validation failed')).toThrow();
      
      try {
        customValidation(false, 'Validation failed', ['field']);
      } catch (error: any) {
        expect(error.errors[0].message).toBe('Validation failed');
        expect(error.errors[0].path).toEqual(['field']);
      }
    });
  });

  describe('clearValidationCache', () => {
    it('should clear the entire cache when no pattern is provided', async () => {
      // Setup schema
      const schema = z.object({
        body: z.object({
          name: z.string(),
        }),
        query: z.object({}),
        params: z.object({}),
      });

      // Setup request data
      mockRequest.body = {
        name: 'Test User',
      };

      // Apply middleware with caching
      const middleware = validate(schema, 'test-cache-key');
      await middleware(mockRequest as Request, mockResponse as Response, nextFunction);
      
      // Clear the cache
      clearValidationCache();
      
      // Reset mock to check after clearing
      nextFunction.mockReset();
      
      // Make the same request, should not use cache
      await middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      // Assert new validation
      expect(nextFunction).toHaveBeenCalledWith();
    });

    it('should clear only cache entries matching the pattern', async () => {
      // Setup schema
      const schema = z.object({
        body: z.object({
          name: z.string(),
        }),
        query: z.object({}),
        params: z.object({}),
      });

      // Setup request data
      mockRequest.body = {
        name: 'Test User',
      };

      // Apply middleware with caching for two different keys
      const middleware1 = validate(schema, 'test-key1');
      const middleware2 = validate(schema, 'test-key2');
      
      await middleware1(mockRequest as Request, mockResponse as Response, nextFunction);
      await middleware2(mockRequest as Request, mockResponse as Response, nextFunction);
      
      // Clear only test-key1 cache
      clearValidationCache('test-key1');
      
      // Reset mocks
      nextFunction.mockReset();
      
      // test-key1 should validate again
      await middleware1(mockRequest as Request, mockResponse as Response, nextFunction);
      expect(nextFunction).toHaveBeenCalledWith();
      
      // Reset mocks again
      nextFunction.mockReset();
      
      // test-key2 should use cache
      await middleware2(mockRequest as Request, mockResponse as Response, nextFunction);
      expect(nextFunction).toHaveBeenCalledWith();
    });
  });
}); 