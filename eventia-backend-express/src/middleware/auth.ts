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

type PublicEndpoint =
  | { path: string; methods?: string[] }
  | { pattern: RegExp; methods?: string[] };

// List of public endpoints that don't require authentication
const PUBLIC_ENDPOINTS: PublicEndpoint[] = [
  { path: '/api/v1/payments/upi-settings' },
  { path: '/api/v1/payments/generate-qr' },
  { path: '/api/v1/admin/upi-settings/active' },
  { path: '/api/v1/admin/upi' },
  { path: '/api/v1/auth/login', methods: ['POST'] },
  { path: '/api/v1/auth/register', methods: ['POST'] },
  { path: '/api/v1/auth/refresh-token', methods: ['POST'] },
  // Public event browsing endpoints (GET only)
  { pattern: /^\/api\/v1\/events$/, methods: ['GET'] },
  { pattern: /^\/api\/v1\/events\/[A-Za-z0-9-]+$/, methods: ['GET'] },
  { pattern: /^\/api\/v1\/events\/[A-Za-z0-9-]+\/(tickets|seats)$/, methods: ['GET'] },
  { pattern: /^\/api\/v1\/events\/categories$/, methods: ['GET'] },
  { pattern: /^\/api\/v1\/events\/ipl$/, methods: ['GET'] }
];

/**
 * Middleware to authenticate requests using JWT
 */
export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check if the endpoint is public
    const isPublicEndpoint = PUBLIC_ENDPOINTS.some(endpoint => {
      if ('pattern' in endpoint) {
        if (!endpoint.pattern.test(req.path)) {
          return false;
        }
        return !endpoint.methods || endpoint.methods.includes(req.method);
      }

      const matchesPath = req.path === endpoint.path || req.path.startsWith(`${endpoint.path}/`);
      if (!matchesPath) {
        return false;
      }

      return !endpoint.methods || endpoint.methods.includes(req.method);
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
