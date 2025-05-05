import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { ApiError } from '../utils/apiError';
import { logger } from '../utils/logger';
import { config } from '../config';

// List of methods that require CSRF protection
const CSRF_PROTECTED_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

// List of routes that don't need CSRF protection
const CSRF_EXEMPTED_ROUTES = [
  '/api/v1/auth/login',
  '/api/v1/auth/register',
  '/api/v1/auth/refresh-token',
  '/api/v1/webhooks/'
];

/**
 * Middleware to generate and provide CSRF token
 */
export const generateCsrfToken = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Generate a random token
    const csrfToken = crypto.randomBytes(32).toString('hex');
    
    // Set it as a cookie with appropriate security settings
    res.cookie('csrf_token', csrfToken, {
      httpOnly: true,
      secure: config.isProduction,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    });
    
    // Also send it in the response header for the frontend to use
    res.setHeader('X-CSRF-Token', csrfToken);
    
    next();
  } catch (error) {
    logger.error('Error generating CSRF token:', error);
    next(ApiError.internal('Failed to generate security token'));
  }
};

/**
 * Middleware to validate CSRF token
 */
export const validateCsrfToken = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Skip CSRF check for non-protected methods
    if (!CSRF_PROTECTED_METHODS.includes(req.method)) {
      return next();
    }
    
    // Skip CSRF check for exempted routes
    for (const route of CSRF_EXEMPTED_ROUTES) {
      if (req.path.startsWith(route)) {
        return next();
      }
    }
    
    // Get token from request header and cookie
    const headerToken = req.headers['x-csrf-token'];
    const cookieToken = req.cookies.csrf_token;
    
    // If in development and no token, allow (for easier development)
    if (config.isDevelopment && (!headerToken || !cookieToken)) {
      logger.warn('CSRF check bypassed in development mode');
      return next();
    }
    
    // In production, always require both tokens
    if (!headerToken || !cookieToken) {
      logger.warn('CSRF validation failed: missing token');
      return next(ApiError.forbidden('CSRF token missing'));
    }
    
    // Check if tokens match
    if (headerToken !== cookieToken) {
      logger.warn('CSRF validation failed: token mismatch');
      return next(ApiError.forbidden('CSRF token invalid'));
    }
    
    // Tokens match, proceed
    next();
  } catch (error) {
    logger.error('Error validating CSRF token:', error);
    next(ApiError.internal('Security validation failed'));
  }
};

export default {
  generateCsrfToken,
  validateCsrfToken
}; 