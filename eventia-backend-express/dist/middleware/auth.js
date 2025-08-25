"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkAdmin = exports.adminMiddleware = exports.authMiddleware = exports.auth = exports.requireAuth = exports.authorize = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../config");
const apiError_1 = require("../utils/apiError");
const logger_1 = require("../utils/logger");
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
const authenticate = (req, res, next) => {
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
            logger_1.logger.debug(`Bypassing authentication for public endpoint: ${req.path}`);
            return next();
        }
        // Get token from cookie first, then fall back to Authorization header
        const tokenFromCookie = req.cookies.access_token;
        const authHeader = req.headers.authorization;
        const tokenFromHeader = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
        const token = tokenFromCookie || tokenFromHeader;
        if (!token) {
            logger_1.logger.debug('Authentication failed: No token provided');
            return next(apiError_1.ApiError.unauthorized('Authentication required'));
        }
        try {
            // Make sure config.jwt.secret is not undefined before using it
            if (!config_1.config.jwt.secret) {
                logger_1.logger.error('JWT secret is not configured');
                return next(apiError_1.ApiError.internal('JWT secret not configured'));
            }
            const decoded = jsonwebtoken_1.default.verify(token, config_1.config.jwt.secret);
            req.user = decoded;
            return next();
        }
        catch (error) {
            const jwtError = error;
            // Handle token expiration specifically
            if (jwtError.name === 'TokenExpiredError') {
                logger_1.logger.debug('Authentication failed: Token expired');
                return next(apiError_1.ApiError.unauthorized('Token expired', 'TOKEN_EXPIRED'));
            }
            logger_1.logger.debug('Authentication failed: Invalid token', error);
            return next(apiError_1.ApiError.unauthorized('Invalid token'));
        }
    }
    catch (error) {
        logger_1.logger.error('Error in auth middleware:', error);
        return next(apiError_1.ApiError.internal('Authentication error'));
    }
};
exports.authenticate = authenticate;
/**
 * Middleware to authorize based on user roles
 */
const authorize = (roleArray) => {
    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            return next(apiError_1.ApiError.forbidden('Access denied. Role required.'));
        }
        // Normalize roles for comparison (uppercase)
        const userRole = req.user.role.toUpperCase();
        const requiredRoles = roleArray.map(role => role.toUpperCase());
        if (requiredRoles.includes(userRole)) {
            return next();
        }
        logger_1.logger.warn(`Access denied for user ${req.user.id} with role ${userRole}. Required roles: ${requiredRoles.join(', ')}`);
        return next(apiError_1.ApiError.forbidden('Access denied. Insufficient role.'));
    };
};
exports.authorize = authorize;
// Combined authentication and authorization middleware
const requireAuth = (roles) => {
    if (!roles) {
        return exports.authenticate;
    }
    // Convert single role to array if needed
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return [exports.authenticate, (0, exports.authorize)(roleArray)];
};
exports.requireAuth = requireAuth;
// Basic auth middleware - modified to return a middleware function
const auth = (role) => {
    if (!role) {
        // If no role is provided, just return the authentication middleware
        return exports.authenticate;
    }
    // If a role is provided, return both authentication and authorization middlewares
    const roleArray = Array.isArray(role) ? role : [role];
    return (req, res, next) => {
        (0, exports.authenticate)(req, res, (err) => {
            if (err) {
                return next(err);
            }
            if (!req.user || !req.user.role) {
                return next(apiError_1.ApiError.forbidden('Access denied. Role required.'));
            }
            // Normalize roles for comparison
            const userRole = req.user.role.toUpperCase();
            const requiredRoles = roleArray.map(role => role.toUpperCase());
            if (requiredRoles.includes(userRole)) {
                return next();
            }
            return next(apiError_1.ApiError.forbidden('Access denied. Insufficient role.'));
        });
    };
};
exports.auth = auth;
// Middleware wrapper that includes the auth middleware
exports.authMiddleware = exports.authenticate;
// Export additional middleware for backwards compatibility
exports.adminMiddleware = (0, exports.authorize)(['ADMIN']);
/**
 * Middleware to check if the user is an admin
 */
const checkAdmin = (req, res, next) => {
    try {
        // For regular admin verification
        if (!req.user?.role || req.user.role.toUpperCase() !== 'ADMIN') {
            logger_1.logger.warn(`Admin access denied for user ${req.user?.id}`);
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
//# sourceMappingURL=auth.js.map