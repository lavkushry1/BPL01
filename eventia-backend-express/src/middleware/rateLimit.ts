import { rateLimit } from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { createClient } from 'redis';
import { config } from '../config';
import { logger } from '../utils/logger';
import { Request } from 'express';

// Create Redis client for production or a memory store for development
const createRedisStore = () => {
  if (config.isProduction || config.redis.host) {
    try {
      const redisClient = createClient({
        url: `redis://${config.redis.host}:${config.redis.port}`,
        password: config.redis.password || undefined,
        database: config.redis.db
      });
      
      // Connect to Redis
      redisClient.connect().catch(err => {
        logger.error('Redis connection error (falling back to memory store):', err);
        return null;
      });
      
      return new RedisStore({
        // @ts-ignore - Type definitions issue with redis 4.x
        sendCommand: (...args: string[]) => redisClient.sendCommand(args),
      });
    } catch (error) {
      logger.error('Redis store creation error (falling back to memory store):', error);
      return null;
    }
  }
  return null;
};

// Store for rate limit data (Redis in production, memory in development)
const limiterStore = createRedisStore();

// Define configuration properties
const MAX_REQUESTS = config.rateLimit.max || 100;
const WINDOW_MS = config.rateLimit.windowMs || 15 * 60 * 1000; // 15 minutes

// Set up standard rate limiter
export const standardLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    message: 'Too many requests, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  handler: (req, res, next, options) => {
    logger.warn(`Rate limit exceeded: ${req.ip} - ${req.method} ${req.originalUrl}`);
    res.status(options.statusCode).json(options.message);
  }
});

// API key rate limiter (higher limits for authenticated clients)
export const apiKeyLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: MAX_REQUESTS * 5, // Higher limit for API keys
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    // Get the user's IP address or API key
    const apiKey = req.get('X-API-Key');
    if (apiKey) {
      return apiKey;
    }
    
    // If no API key, use the IP address
    // Return a default value instead of undefined
    return req.ip || 'unknown-ip';
  }
});

// Strict rate limiter for sensitive endpoints
export const strictLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: 30, // Lower limit for sensitive operations
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    message: 'Too many requests for this operation, please try again later.',
    code: 'STRICT_RATE_LIMIT_EXCEEDED'
  }
});

// Login rate limiter to prevent brute force
export const loginLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 requests per hour
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Only count failed attempts
  message: {
    status: 'error',
    message: 'Too many login attempts, please try again later.',
    code: 'LOGIN_ATTEMPTS_EXCEEDED'
  }
});

// Auth routes rate limiter
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 requests per 15 minutes for auth endpoints
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    message: 'Too many authentication requests, please try again later.',
    code: 'AUTH_RATE_LIMIT_EXCEEDED'
  }
});

export default {
  standardLimiter,
  apiKeyLimiter,
  strictLimiter,
  loginLimiter,
  authLimiter
}; 