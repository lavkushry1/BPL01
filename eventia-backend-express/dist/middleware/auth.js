"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.auth = exports.authorize = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../config");
const apiError_1 = require("../utils/apiError");
const authenticate = (req, res, next) => {
    try {
        // Get token from headers
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw apiError_1.ApiError.unauthorized('Authentication required');
        }
        const token = authHeader.split(' ')[1];
        // Check if JWT secret is configured
        if (!config_1.config.jwt.secret) {
            throw apiError_1.ApiError.internal('JWT secret is not configured');
        }
        try {
            // Verify token
            // Use type casting to bypass TypeScript type checking
            const jwtVerify = jsonwebtoken_1.default.verify;
            const decoded = jwtVerify(token, config_1.config.jwt.secret);
            req.user = decoded;
            next();
        }
        catch (error) {
            if (error.name === 'TokenExpiredError') {
                throw apiError_1.ApiError.unauthorized('Token expired');
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
 * @param role Optional role to check after authentication
 */
const auth = (role) => {
    if (role) {
        return [exports.authenticate, (0, exports.authorize)([role])];
    }
    return exports.authenticate;
};
exports.auth = auth;
