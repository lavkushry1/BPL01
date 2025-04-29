import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { ApiError } from '../utils/apiError';

// Extend Express Request interface to include the user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // Get token from headers
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw ApiError.unauthorized('Authentication required');
    }

    const token = authHeader.split(' ')[1];
    
    // Check if JWT secret is configured
    if (!config.jwt.secret) {
      throw ApiError.internal('JWT secret is not configured');
    }

    try {
      // Verify token
      // Use type casting to bypass TypeScript type checking
      const jwtVerify: any = jwt.verify;
      const decoded = jwtVerify(token, config.jwt.secret);
      req.user = decoded;
      next();
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        throw ApiError.unauthorized('Token expired');
      }
      throw ApiError.unauthorized('Invalid token');
    }
  } catch (error) {
    next(error);
  }
};

export const authorize = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw ApiError.unauthorized('Authentication required');
      }

      if (!roles.includes(req.user.role)) {
        throw ApiError.forbidden('Insufficient permissions');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Combined authentication and authorization middleware
 * @param role Optional role to check after authentication
 */
export const auth = (role?: string) => {
  if (role) {
    return [authenticate, authorize([role])];
  }
  return authenticate;
};
