import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authenticate, authorize } from '../../../middleware/auth';
import { ApiError } from '../../../utils/apiError';

// Mock jwt
jest.mock('jsonwebtoken');

// Mock config
jest.mock('../../../config', () => ({
  config: {
    jwt: {
      secret: 'test-secret',
    },
  },
}));

// Mock logger
jest.mock('../../../utils/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('Auth Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: jest.Mock;

  beforeEach(() => {
    mockRequest = {
      path: '/api/v1/events',
      headers: {},
      cookies: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    nextFunction = jest.fn();

    jest.clearAllMocks();
  });

  describe('authenticate middleware', () => {
    it('should pass for public endpoints', () => {
      (mockRequest as any).path = '/api/v1/events'; // This is a public endpoint

      authenticate(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith();
      expect(nextFunction).not.toHaveBeenCalledWith(expect.any(ApiError));
    });

    it('should pass for public endpoints with wildcard', () => {
      (mockRequest as any).path = '/api/v1/events/123'; // This should match the wildcard pattern

      authenticate(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith();
      expect(nextFunction).not.toHaveBeenCalledWith(expect.any(ApiError));
    });

    it('should require authentication for non-public endpoints', () => {
      (mockRequest as any).path = '/api/v1/user/profile'; // Non-public endpoint

      authenticate(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith(expect.any(ApiError));
      expect(nextFunction.mock.calls[0][0].statusCode).toBe(401);
    });

    it('should accept token from authorization header', () => {
      (mockRequest as any).path = '/api/v1/user/profile'; // Non-public endpoint
      mockRequest.headers = {
        authorization: 'Bearer valid-token',
      };

      const mockDecodedToken = { id: 'user-123', role: 'USER' };
      (jwt.verify as jest.Mock).mockReturnValue(mockDecodedToken);

      authenticate(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(jwt.verify).toHaveBeenCalledWith('valid-token', 'test-secret');
      expect(mockRequest.user).toEqual(mockDecodedToken);
      expect(nextFunction).toHaveBeenCalledWith();
    });

    it('should accept token from cookies', () => {
      (mockRequest as any).path = '/api/v1/user/profile'; // Non-public endpoint
      mockRequest.cookies = {
        access_token: 'cookie-token',
      };

      const mockDecodedToken = { id: 'user-123', role: 'USER' };
      (jwt.verify as jest.Mock).mockReturnValue(mockDecodedToken);

      authenticate(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(jwt.verify).toHaveBeenCalledWith('cookie-token', 'test-secret');
      expect(mockRequest.user).toEqual(mockDecodedToken);
      expect(nextFunction).toHaveBeenCalledWith();
    });

    it('should prioritize cookie token over header token', () => {
      (mockRequest as any).path = '/api/v1/user/profile'; // Non-public endpoint
      mockRequest.headers = {
        authorization: 'Bearer header-token',
      };
      mockRequest.cookies = {
        access_token: 'cookie-token',
      };

      const mockDecodedToken = { id: 'user-123', role: 'USER' };
      (jwt.verify as jest.Mock).mockReturnValue(mockDecodedToken);

      authenticate(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(jwt.verify).toHaveBeenCalledWith('cookie-token', 'test-secret');
      expect(mockRequest.user).toEqual(mockDecodedToken);
      expect(nextFunction).toHaveBeenCalledWith();
    });

    it('should handle expired tokens', () => {
      (mockRequest as any).path = '/api/v1/user/profile'; // Non-public endpoint
      mockRequest.headers = {
        authorization: 'Bearer expired-token',
      };

      const tokenError = new Error('Token expired');
      tokenError.name = 'TokenExpiredError';
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw tokenError;
      });

      authenticate(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(jwt.verify).toHaveBeenCalledWith('expired-token', 'test-secret');
      expect(nextFunction).toHaveBeenCalledWith(expect.any(ApiError));
      expect(nextFunction.mock.calls[0][0].code).toBe('TOKEN_EXPIRED');
    });

    it('should handle invalid tokens', () => {
      (mockRequest as any).path = '/api/v1/user/profile'; // Non-public endpoint
      mockRequest.headers = {
        authorization: 'Bearer invalid-token',
      };

      const tokenError = new Error('Invalid token');
      tokenError.name = 'JsonWebTokenError';
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw tokenError;
      });

      authenticate(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(jwt.verify).toHaveBeenCalledWith('invalid-token', 'test-secret');
      expect(nextFunction).toHaveBeenCalledWith(expect.any(ApiError));
      expect(nextFunction.mock.calls[0][0].statusCode).toBe(401);
    });

    it('should handle missing JWT secret', () => {
      (mockRequest as any).path = '/api/v1/user/profile'; // Non-public endpoint
      mockRequest.headers = {
        authorization: 'Bearer valid-token',
      };

      // Override the mocked config to simulate missing JWT secret
      jest.mock('../../../config', () => ({
        config: {
          jwt: {},
        },
      }));

      // Re-require the module to get updated mock
      jest.isolateModules(() => {
        const { config } = require('../../../config');
        config.jwt.secret = undefined;

        const { authenticate: isolatedAuthenticate } = require('../../../middleware/auth');
        isolatedAuthenticate(mockRequest as Request, mockResponse as Response, nextFunction);
      });

      expect(nextFunction).toHaveBeenCalledWith(expect.any(ApiError));
      expect(nextFunction.mock.calls[0][0].statusCode).toBe(500);
    });
  });

  describe('authorize middleware', () => {
    beforeEach(() => {
      mockRequest.user = { id: 'user-123', role: 'USER' };
    });

    it('should pass for matching role', () => {
      const authorizeUser = authorize(['USER']);
      authorizeUser(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith();
      expect(nextFunction).not.toHaveBeenCalledWith(expect.any(ApiError));
    });

    it('should pass for any of multiple roles', () => {
      const authorizeUserOrAdmin = authorize(['USER', 'ADMIN']);
      authorizeUserOrAdmin(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith();
      expect(nextFunction).not.toHaveBeenCalledWith(expect.any(ApiError));
    });

    it('should handle role case insensitively', () => {
      mockRequest.user = { id: 'user-123', role: 'user' }; // lowercase role
      const authorizeUser = authorize(['USER']); // uppercase in check
      authorizeUser(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith();
      expect(nextFunction).not.toHaveBeenCalledWith(expect.any(ApiError));
    });

    it('should reject for non-matching role', () => {
      const authorizeAdmin = authorize(['ADMIN']);
      authorizeAdmin(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith(expect.any(ApiError));
      expect(nextFunction.mock.calls[0][0].statusCode).toBe(403);
    });

    it('should reject when user has no role', () => {
      mockRequest.user = { id: 'user-123' }; // No role
      const authorizeUser = authorize(['USER']);
      authorizeUser(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith(expect.any(ApiError));
      expect(nextFunction.mock.calls[0][0].statusCode).toBe(403);
    });

    it('should reject when no user in request', () => {
      mockRequest.user = undefined; // No user
      const authorizeUser = authorize(['USER']);
      authorizeUser(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith(expect.any(ApiError));
      expect(nextFunction.mock.calls[0][0].statusCode).toBe(403);
    });
  });
});