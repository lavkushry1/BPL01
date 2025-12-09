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
      const sanitizedData = {
        body: sanitizeData(req.body),
        query: sanitizeData(req.query),
        params: sanitizeData(req.params),
      };

      // Apply sanitized data back to request
      req.body = sanitizedData.body;
      // req.query is a getter-only property in some environments, so we mutate the object
      if (req.query && typeof req.query === 'object') {
        Object.keys(req.query).forEach(key => delete (req.query as any)[key]);
        Object.assign(req.query, sanitizedData.query);
      }

      // Same for params which might be read-only
      if (req.params && typeof req.params === 'object') {
        Object.keys(req.params).forEach(key => delete (req.params as any)[key]);
        Object.assign(req.params, sanitizedData.params);
      }

      // Validate with Zod
      try {
        await schema.parseAsync(sanitizedData);
      } catch (err) {
        console.log('Sanitized Data:', JSON.stringify(sanitizedData, null, 2));
        console.log('Schema Error:', err);
        throw err;
      }

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

        console.log('Validation Error:', JSON.stringify(errors, null, 2));
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
