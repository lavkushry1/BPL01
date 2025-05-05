import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { ApiError } from '../utils/apiError';
import { logger } from '../utils/logger';

// Extend Express Request interface to include the user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

// List of public endpoints that don't require authentication
const PUBLIC_ENDPOINTS = [
  '/api/v1/payments/upi-settings',
  '/api/v1/payments/generate-qr',
  '/api/v1/admin/upi-settings/active',
  '/api/v1/admin/upi',
  '/api/v1/events', // Base events endpoints
  '/api/v1/events/*', // Event details with IDs
  '/api/v1/auth/login',
  '/api/v1/auth/register',
  '/api/v1/auth/refresh-token'
];

/**
 * Middleware to authenticate requests using JWT
 */
export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check if the endpoint is public
    const isPublicEndpoint = PUBLIC_ENDPOINTS.some(endpoint => {
      // Allow exact matches
      if (req.path === endpoint) {
        return true;
      }

      // Check if the current path starts with any public endpoint pattern
      // This handles cases like '/api/v1/events/123' matching '/api/v1/events'
      if (endpoint.endsWith('*')) {
        const baseEndpoint = endpoint.slice(0, -1); // Remove the '*'
        return req.path.startsWith(baseEndpoint);
      }

      // Also check if it's a subpath of a public endpoint
      // e.g. if '/api/v1/events' is public, then '/api/v1/events/123' is also public
      return req.path.startsWith(endpoint + '/');
    });

    if (isPublicEndpoint) {
      logger.debug(`Bypassing authentication for public endpoint: ${req.path}`);
      return next();
    }

    // Get token from cookie first, then fall back to Authorization header
    const tokenFromCookie = req.cookies.access_token;
    const authHeader = req.headers.authorization;
    const tokenFromHeader = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    
    const token = tokenFromCookie || tokenFromHeader;

    if (!token) {
      logger.debug('Authentication failed: No token provided');
      return next(ApiError.unauthorized('Authentication required'));
    }

    try {
      // Make sure config.jwt.secret is not undefined before using it
      if (!config.jwt.secret) {
        logger.error('JWT secret is not configured');
        return next(ApiError.internal('JWT secret not configured'));
      }

      const decoded = jwt.verify(token, config.jwt.secret);
      req.user = decoded;
      return next();
    } catch (error) {
      const jwtError = error as Error;
      
      // Handle token expiration specifically
      if (jwtError.name === 'TokenExpiredError') {
        logger.debug('Authentication failed: Token expired');
        return next(ApiError.unauthorized('Token expired', 'TOKEN_EXPIRED'));
      }
      
      logger.debug('Authentication failed: Invalid token', error);
      return next(ApiError.unauthorized('Invalid token'));
    }
  } catch (error) {
    logger.error('Error in auth middleware:', error);
    return next(ApiError.internal('Authentication error'));
  }
};

/**
 * Middleware to authorize based on user roles
 */
export const authorize = (roleArray: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.role) {
      return next(ApiError.forbidden('Access denied. Role required.'));
    }

    // Normalize roles for comparison (uppercase)
    const userRole = req.user.role.toUpperCase();
    const requiredRoles = roleArray.map(role => role.toUpperCase());

    if (requiredRoles.includes(userRole)) {
      return next();
    }

    logger.warn(`Access denied for user ${req.user.id} with role ${userRole}. Required roles: ${requiredRoles.join(', ')}`);
    return next(ApiError.forbidden('Access denied. Insufficient role.'));
  };
};

// Combined authentication and authorization middleware
export const requireAuth = (roles?: string | string[]) => {
  if (!roles) {
    return authenticate;
  }

  // Convert single role to array if needed
  const roleArray = Array.isArray(roles) ? roles : [roles];
  return [authenticate, authorize(roleArray)];
};

// Basic auth middleware - modified to return a middleware function
export const auth = (role?: string | string[]) => {
  if (!role) {
    // If no role is provided, just return the authentication middleware
    return authenticate;
  }

  // If a role is provided, return both authentication and authorization middlewares
  const roleArray = Array.isArray(role) ? role : [role];
  return (req: Request, res: Response, next: NextFunction) => {
    authenticate(req, res, (err) => {
      if (err) {
        return next(err);
      }

      if (!req.user || !req.user.role) {
        return next(ApiError.forbidden('Access denied. Role required.'));
      }

      // Normalize roles for comparison
      const userRole = req.user.role.toUpperCase();
      const requiredRoles = roleArray.map(role => role.toUpperCase());

      if (requiredRoles.includes(userRole)) {
        return next();
      }

      return next(ApiError.forbidden('Access denied. Insufficient role.'));
    });
  };
};

// Middleware wrapper that includes the auth middleware
export const authMiddleware = authenticate;

// Export additional middleware for backwards compatibility
export const adminMiddleware = authorize(['ADMIN']);

/**
 * Middleware to check if the user is an admin
 */
export const checkAdmin = (req: Request, res: Response, next: NextFunction) => {
  try {
    // For regular admin verification
    if (!req.user?.role || req.user.role.toUpperCase() !== 'ADMIN') {
      logger.warn(`Admin access denied for user ${req.user?.id}`);
      return next(ApiError.forbidden('Admin access required'));
    }

    next();
  } catch (error) {
    logger.error(`Error in admin check: ${error}`);
    next(ApiError.internal('Error checking admin status'));
  }
};
