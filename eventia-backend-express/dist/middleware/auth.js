"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkAdmin = exports.adminMiddleware = exports.authMiddleware = exports.auth = exports.authorize = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../config");
const apiError_1 = require("../utils/apiError");
const logger_1 = require("../utils/logger");
const authenticate = (req, res, next) => {
    try {
        // Get token from headers
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            logger_1.logger.debug('Authentication failed: No Bearer token provided');
            throw apiError_1.ApiError.unauthorized('Authentication required');
        }
        const token = authHeader.split(' ')[1];
        // Validate token format before verification
        if (!token || typeof token !== 'string' || token.split('.').length !== 3) {
            logger_1.logger.debug(`Invalid token format: ${token ? token.substring(0, 20) + '...' : 'empty token'}`);
            throw apiError_1.ApiError.unauthorized('Invalid token format');
        }
        // Special handling for development environment test tokens
        if (isDevelopment) {
            try {
                const tokenParts = token.split('.');
                const decodedPayload = Buffer.from(tokenParts[1], 'base64url').toString('utf-8');
                const payload = JSON.parse(decodedPayload);
                // If this is our test admin token, bypass verification
                if (payload.role === 'admin' &&
                    (payload.email === 'admin@example.com' || payload.id === 'admin-mock-id')) {
                    logger_1.logger.info('Development test token accepted, bypassing verification');
                    req.user = payload;
                    return next();
                }
            }
            catch (error) {
                // Continue with normal verification if test token detection fails
                logger_1.logger.debug('Error checking for development test token:', error);
            }
        }
        // Check if JWT secret is configured
        if (!config_1.config.jwt.secret) {
            logger_1.logger.error('JWT secret is not configured in environment');
            throw apiError_1.ApiError.internal('JWT secret is not configured');
        }
        try {
            // Use proper verification with audience and issuer
            const decoded = jsonwebtoken_1.default.verify(token, config_1.config.jwt.secret, {
                audience: 'eventia-app',
                issuer: 'eventia-api',
            });
            // Ensure decoded payload has required fields
            if (!decoded || typeof decoded !== 'object' || !decoded.id) {
                logger_1.logger.debug('Token payload missing required fields');
                throw new Error('Invalid token payload');
            }
            req.user = decoded;
            next();
        }
        catch (error) {
            logger_1.logger.debug(`Token verification error: ${error.name} - ${error.message}`);
            if (error.name === 'TokenExpiredError') {
                throw apiError_1.ApiError.unauthorized('Token expired');
            }
            else if (error.name === 'JsonWebTokenError') {
                throw apiError_1.ApiError.unauthorized(`Invalid token: ${error.message}`);
            }
            else if (error.name === 'NotBeforeError') {
                throw apiError_1.ApiError.unauthorized('Token not yet valid');
            }
            throw apiError_1.ApiError.unauthorized('Invalid token');
        }
    }
    catch (error) {
        next(error);
    }
};
exports.authenticate = authenticate;
const authorize = (roles) => {
    return (req, res, next) => {
        try {
            if (!req.user) {
                throw apiError_1.ApiError.unauthorized('Authentication required');
            }
            if (!roles.includes(req.user.role)) {
                throw apiError_1.ApiError.forbidden('Insufficient permissions');
            }
            next();
        }
        catch (error) {
            next(error);
        }
    };
};
exports.authorize = authorize;
/**
 * Combined authentication and authorization middleware
 * @param roles A single role or array of roles to check after authentication
 */
const auth = (roles) => {
    if (!roles) {
        return exports.authenticate;
    }
    // Convert single role to array if needed
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return [exports.authenticate, (0, exports.authorize)(roleArray)];
};
exports.auth = auth;
// Export additional middleware for backwards compatibility
exports.authMiddleware = exports.authenticate;
exports.adminMiddleware = (0, exports.authorize)(['admin']);
// Check if this is a development environment
const isDevelopment = process.env.NODE_ENV === 'development';
/**
 * Middleware to check if the user is an admin
 */
const checkAdmin = (req, res, next) => {
    try {
        // In development environment, check for special test tokens
        if (isDevelopment) {
            const authHeader = req.headers.authorization;
            if (authHeader && authHeader.startsWith('Bearer ')) {
                const token = authHeader.split(' ')[1];
                // Check if this is a special development token with admin role
                try {
                    const tokenParts = token.split('.');
                    if (tokenParts.length === 3) {
                        // For development tokens, we need to decode the base64url format properly
                        const decodedPayload = Buffer.from(tokenParts[1], 'base64url').toString('utf-8');
                        const payload = JSON.parse(decodedPayload);
                        // If the token has admin role and is a mock token, allow access
                        if (payload.role === 'admin' &&
                            (payload.email === 'admin@example.com' || payload.id === 'admin-mock-id')) {
                            logger_1.logger.info('Development admin token accepted for testing');
                            req.user = {
                                id: payload.id || 'admin-test-id',
                                email: payload.email,
                                role: 'admin'
                            };
                            return next();
                        }
                    }
                }
                catch (error) {
                    // If token parsing fails, continue with normal verification
                    logger_1.logger.error('Error parsing development token:', error);
                }
            }
        }
        // For regular admin verification
        if (req.user?.role !== 'admin') {
            logger_1.logger.error(`Admin access denied for user ${req.user?.id}`);
            return next(apiError_1.ApiError.forbidden('Admin access required'));
        }
        next();
    }
    catch (error) {
        logger_1.logger.error(`Error in admin check: ${error}`);
        next(apiError_1.ApiError.internal('Error checking admin status'));
    }
};
exports.checkAdmin = checkAdmin;
