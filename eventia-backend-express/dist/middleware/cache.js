"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearCache = exports.cacheMiddleware = void 0;
const cacheService_1 = require("../services/cacheService");
const logger_1 = require("../utils/logger");
/**
 * Express middleware for caching API responses
 */
const cacheMiddleware = (options = {}) => {
    const { ttl = 300, // 5 minutes default
    keyPrefix = 'api:cache:', keyGenerator, condition, } = options;
    return async (req, res, next) => {
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
            const key = keyPrefix + (keyGenerator
                ? keyGenerator(req)
                : `${req.originalUrl || req.url}${JSON.stringify(req.query) || ''}`);
            // Check if response is in cache
            const cachedData = await cacheService_1.cacheService.get(key);
            // If cache hit, return cached response
            if (cachedData) {
                logger_1.logger.debug('Cache hit', { key });
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
            res.json = function (data) {
                // Restore original json method
                res.json = originalJson;
                // Cache the response if status is success (2xx)
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    const headers = {};
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
                    cacheService_1.cacheService.set(key, dataToCache, ttl)
                        .catch((err) => logger_1.logger.error('Failed to cache response', { error: err.message, key }));
                }
                // Call the original json method
                return originalJson.call(this, data);
            };
            next();
        }
        catch (error) {
            logger_1.logger.error('Cache middleware error', { error });
            next();
        }
    };
};
exports.cacheMiddleware = cacheMiddleware;
/**
 * Middleware to clear cache by pattern
 */
const clearCache = (pattern) => {
    return async (_req, _res, next) => {
        try {
            await cacheService_1.cacheService.delByPattern(pattern);
        }
        catch (error) {
            logger_1.logger.error('Clear cache middleware error', { error, pattern });
        }
        next();
    };
};
exports.clearCache = clearCache;
//# sourceMappingURL=cache.js.map