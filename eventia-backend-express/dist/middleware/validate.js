"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.customValidation = exports.clearValidationCache = exports.validate = void 0;
const node_cache_1 = __importDefault(require("node-cache"));
const zod_1 = require("zod");
const apiError_1 = require("../utils/apiError");
// Cache for validation schemas (with 10 min TTL)
const validationCache = new node_cache_1.default({ stdTTL: 600, checkperiod: 120 });
/**
 * Sanitize data before validation
 */
const sanitizeData = (data) => {
    if (!data)
        return data;
    // Handle objects recursively
    if (typeof data === 'object' && data !== null) {
        // Handle arrays specifically
        if (Array.isArray(data)) {
            return data.map(item => sanitizeData(item));
        }
        // For non-array objects
        const result = {};
        Object.entries(data).forEach(([key, value]) => {
            // Skip null values
            if (value === null) {
                result[key] = null;
                return;
            }
            if (typeof value === 'string') {
                // Trim strings
                result[key] = value.trim();
            }
            else if (typeof value === 'object') {
                // Recursively sanitize nested objects
                result[key] = sanitizeData(value);
            }
            else {
                result[key] = value;
            }
        });
        return result;
    }
    // Handle string values
    if (typeof data === 'string') {
        return data.trim();
    }
    return data;
};
/**
 * Enhanced validation middleware with sanitization and caching
 */
const validate = (schema, cacheKey) => {
    return async (req, _res, next) => {
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
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                const errors = error.errors.map((err) => ({
                    path: err.path.join('.'),
                    message: err.message,
                    code: err.code,
                }));
                console.log('Validation Error:', JSON.stringify(errors, null, 2));
                next(apiError_1.ApiError.badRequest('Validation failed', 'VALIDATION_ERROR', errors));
            }
            else {
                next(error);
            }
        }
    };
};
exports.validate = validate;
/**
 * Clear validation cache
 */
const clearValidationCache = (pattern) => {
    if (pattern) {
        const keys = validationCache.keys().filter(key => key.startsWith(pattern));
        keys.forEach(key => validationCache.del(key));
    }
    else {
        validationCache.flushAll();
    }
};
exports.clearValidationCache = clearValidationCache;
/**
 * Add custom validation error handler
 */
const customValidation = (condition, message, path = []) => {
    if (!condition) {
        throw new zod_1.ZodError([
            {
                code: 'custom',
                message,
                path,
            }
        ]);
    }
};
exports.customValidation = customValidation;
//# sourceMappingURL=validate.js.map