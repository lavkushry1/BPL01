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
const authenticate = (req, res, next) => {
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