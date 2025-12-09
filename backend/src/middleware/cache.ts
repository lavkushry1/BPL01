import { Request, Response, NextFunction } from 'express';
import { cacheService } from '../services/cacheService';
import { logger } from '../utils/logger';

interface CacheOptions {
  ttl?: number; // Time to live in seconds
  keyPrefix?: string; // Prefix for cache key
  keyGenerator?: (req: Request) => string; // Custom key generator
  condition?: (req: Request) => boolean; // Condition to decide whether to cache
}

/**
 * Express middleware for caching API responses
 */
export const cacheMiddleware = (options: CacheOptions = {}) => {
  const {
    ttl = 300, // 5 minutes default
    keyPrefix = 'api:cache:',
    keyGenerator,
    condition,
  } = options;

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Skip caching for non-GET requests
    if (req.method !== 'GET') {
      next();
      return;
    }
    
    // Skip caching if condition is provided and returns false
    if (condition && !condition(req)) {
      next();
      return;
    }
    
    try {
      // Generate cache key
      const key = keyPrefix + (
        keyGenerator 
          ? keyGenerator(req) 
          : `${req.originalUrl || req.url}${JSON.stringify(req.query) || ''}`
      );
      
      // Check if response is in cache
      const cachedData = await cacheService.get<{
        status: number;
        data: any;
        headers: Record<string, string>;
      }>(key);
      
      // If cache hit, return cached response
      if (cachedData) {
        logger.debug('Cache hit', { key });
        
        // Set headers from cached response
        if (cachedData.headers) {
          Object.entries(cachedData.headers).forEach(([name, value]) => {
            res.setHeader(name, value);
          });
        }
        
        // Set cache header
        res.setHeader('X-Cache', 'HIT');
        
        // Send cached response
        res.status(cachedData.status).json(cachedData.data);
        return;
      }
      
      // Set cache header for miss
      res.setHeader('X-Cache', 'MISS');
      
      // Store the original json method
      const originalJson = res.json;
      
      // Override json method to intercept the response
      res.json = function (data: any): Response {
        // Restore original json method
        res.json = originalJson;
        
        // Cache the response if status is success (2xx)
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const headers: Record<string, string> = {};
          
          // Get headers to cache
          const headersToCache = ['content-type', 'cache-control', 'etag'];
          headersToCache.forEach((header) => {
            const value = res.getHeader(header);
            if (value) {
              headers[header] = value.toString();
            }
          });
          
          // Store in cache
          const dataToCache = {
            status: res.statusCode,
            data,
            headers,
          };
          
          cacheService.set(key, dataToCache, ttl)
            .catch((err) => logger.error('Failed to cache response', { error: err.message, key }));
        }
        
        // Call the original json method
        return originalJson.call(this, data);
      };
      
      next();
    } catch (error) {
      logger.error('Cache middleware error', { error });
      next();
    }
  };
};

/**
 * Middleware to clear cache by pattern
 */
export const clearCache = (pattern: string) => {
  return async (_req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      await cacheService.delByPattern(pattern);
    } catch (error) {
      logger.error('Clear cache middleware error', { error, pattern });
    }
    next();
  };
};