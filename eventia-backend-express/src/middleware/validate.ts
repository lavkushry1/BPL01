import { NextFunction, Request, Response } from 'express';
import NodeCache from 'node-cache';
import { ZodError, ZodSchema } from 'zod';
import { ApiError } from '../utils/apiError';

// Cache for validation schemas (with 10 min TTL)
const validationCache = new NodeCache({ stdTTL: 600, checkperiod: 120 });

/**
 * Sanitize data before validation
 */
const sanitizeData = <T>(data: T): T => {
  if (!data) return data;

  // Handle objects recursively
  if (typeof data === 'object' && data !== null) {
    // Handle arrays specifically
    if (Array.isArray(data)) {
      return data.map(item => sanitizeData(item)) as unknown as T;
    }

    // For non-array objects
    const result: Record<string, any> = {};

    Object.entries(data as Record<string, any>).forEach(([key, value]) => {
      // Skip null values
      if (value === null) {
        result[key] = null;
        return;
      }

      if (typeof value === 'string') {
        // Trim strings
        result[key] = value.trim();
      } else if (typeof value === 'object') {
        // Recursively sanitize nested objects
        result[key] = sanitizeData(value);
      } else {
        result[key] = value;
      }
    });

    return result as T;
  }

  // Handle string values
  if (typeof data === 'string') {
    return data.trim() as unknown as T;
  }

  return data;
};

/**
 * Enhanced validation middleware with sanitization and caching
 */
export const validate = (schema: ZodSchema, cacheKey?: string) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      // Check cache for this request if cacheKey is provided
      if (cacheKey) {
        const cacheKeyWithParams = `${cacheKey}:${JSON.stringify({
          body: Object.keys(req.body || {}),
          query: req.query,
          params: req.params
        })}`;

        const cachedResult = validationCache.get(cacheKeyWithParams);
        if (cachedResult) {
          next();
          return;
        }
      }

      // Sanitize request data
      console.log('Validate Middleware - req.body:', JSON.stringify(req.body, null, 2));
      const sanitizedData = {
        body: sanitizeData(req.body),
        query: sanitizeData(req.query),
        params: sanitizeData(req.params),
      };
      console.log('Validate Middleware - sanitizedData.body:', JSON.stringify(sanitizedData.body, null, 2));

      // Apply sanitized data back to request
      req.body = sanitizedData.body;
      req.query = sanitizedData.query;
      req.params = sanitizedData.params;

      // Validate with Zod
      await schema.parseAsync(sanitizedData);

      // Cache successful validation result if cacheKey is provided
      if (cacheKey) {
        const cacheKeyWithParams = `${cacheKey}:${JSON.stringify({
          body: Object.keys(req.body || {}),
          query: req.query,
          params: req.params
        })}`;
        validationCache.set(cacheKeyWithParams, true);
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map((err) => ({
          path: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));

        next(ApiError.badRequest('Validation failed', 'VALIDATION_ERROR', errors));
      } else {
        next(error);
      }
    }
  };
};

/**
 * Clear validation cache
 */
export const clearValidationCache = (pattern?: string): void => {
  if (pattern) {
    const keys = validationCache.keys().filter(key => key.startsWith(pattern));
    keys.forEach(key => validationCache.del(key));
  } else {
    validationCache.flushAll();
  }
};

/**
 * Add custom validation error handler
 */
export const customValidation = (condition: boolean, message: string, path: string[] = []): void => {
  if (!condition) {
    throw new ZodError([
      {
        code: 'custom',
        message,
        path,
      }
    ]);
  }
};
