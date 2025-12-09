"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.me = exports.logout = exports.refreshToken = exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const config_1 = require("../config");
const user_1 = __importStar(require("../models/user"));
const apiError_1 = require("../utils/apiError");
const apiResponse_1 = require("../utils/apiResponse");
const asyncHandler_1 = require("../utils/asyncHandler");
const jwt_1 = require("../utils/jwt");
const logger_1 = require("../utils/logger");
exports.register = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { email, password, name } = user_1.registerSchema.parse(req.body);
    // Check if user already exists
    const existingUser = await user_1.default.findByEmail(email);
    if (existingUser) {
        throw apiError_1.ApiError.conflict('Email already in use');
    }
    // Hash password
    const hashedPassword = await bcryptjs_1.default.hash(password, 12);
    // Create user in database with enforced USER role
    const newUser = await user_1.default.create({
        email,
        name,
        password: hashedPassword,
        role: 'USER',
    });
    // Remove password from response
    const { password: _, ...userWithoutPassword } = newUser;
    // Send response
    apiResponse_1.ApiResponse.created(res, userWithoutPassword, 'User registered successfully');
});
exports.login = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { email, password } = user_1.loginSchema.parse(req.body);
    // Find user by email
    const user = await user_1.default.findByEmail(email);
    if (!user) {
        throw apiError_1.ApiError.unauthorized('Invalid credentials');
    }
    // Check password
    const isPasswordValid = await bcryptjs_1.default.compare(password, user.password);
    if (!isPasswordValid) {
        // Log failed login attempt
        logger_1.logger.warn(`Failed login attempt for user: ${email}`);
        throw apiError_1.ApiError.unauthorized('Invalid credentials');
    }
    // Generate JWT token using our utility
    const token = (0, jwt_1.generateToken)({
        id: user.id,
        email: user.email,
        role: user.role
    }, config_1.config.jwt.accessExpiration);
    // Generate refresh token
    const refreshToken = (0, jwt_1.generateToken)({ id: user.id }, config_1.config.jwt.refreshExpiration);
    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    // Set tokens in HttpOnly cookies
    res.cookie('access_token', token, {
        httpOnly: true,
        secure: config_1.config.isProduction, // Secure in production
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000 // 1 day in milliseconds
    });
    res.cookie('refresh_token', refreshToken, {
        httpOnly: true,
        secure: config_1.config.isProduction,
        sameSite: 'lax',
        path: '/api/v1/auth/refresh-token', // Restrict to refresh endpoint
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
    });
    // Send response with user data but without tokens in body for security
    apiResponse_1.ApiResponse.success(res, 200, 'Login successful', {
        user: userWithoutPassword,
        // Include tokens in dev environment for testing but not in production
        ...(config_1.config.isDevelopment ? { token, refreshToken } : {})
    });
});
exports.refreshToken = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    // Get refresh token from cookie or request body (for backward compatibility)
    const tokenFromCookie = req.cookies.refresh_token;
    const tokenFromBody = req.body.refreshToken;
    const refreshToken = tokenFromCookie || tokenFromBody;
    if (!refreshToken) {
        throw apiError_1.ApiError.badRequest('Refresh token is required');
    }
    // Log token debug info
    const tokenType = typeof refreshToken;
    const tokenLength = refreshToken ? refreshToken.length : 0;
    logger_1.logger.debug(`Refresh token type: ${tokenType}, length: ${tokenLength}`);
    // Basic format validation
    if (typeof refreshToken !== 'string' || !refreshToken.includes('.')) {
        logger_1.logger.debug('Token format validation failed: not a valid JWT structure');
        throw apiError_1.ApiError.unauthorized('Invalid refresh token format');
    }
    // Verify token using our utility
    const decoded = (0, jwt_1.verifyToken)(refreshToken);
    if (!decoded) {
        logger_1.logger.debug('Token verification returned null');
        throw apiError_1.ApiError.unauthorized('Invalid refresh token');
    }
    // Find user
    const user = await user_1.default.findById(decoded.id);
    if (!user) {
        logger_1.logger.debug(`User not found for id: ${decoded.id}`);
        throw apiError_1.ApiError.unauthorized('Invalid refresh token');
    }
    // Generate new tokens using our utility
    const newToken = (0, jwt_1.generateToken)({
        id: user.id,
        email: user.email,
        role: user.role
    }, config_1.config.jwt.accessExpiration);
    const newRefreshToken = (0, jwt_1.generateToken)({ id: user.id }, config_1.config.jwt.refreshExpiration);
    // Set new tokens in HttpOnly cookies
    res.cookie('access_token', newToken, {
        httpOnly: true,
        secure: config_1.config.isProduction,
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000 // 1 day
    });
    res.cookie('refresh_token', newRefreshToken, {
        httpOnly: true,
        secure: config_1.config.isProduction,
        sameSite: 'lax',
        path: '/api/v1/auth/refresh-token',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    // Send response
    apiResponse_1.ApiResponse.success(res, 200, 'Token refreshed successfully', {
        // Frontend expects 'accessToken' not 'token'
        accessToken: newToken,
        user: userWithoutPassword,
        // Include tokens in development for testing but not in production
        ...(config_1.config.isDevelopment ? { refreshToken: newRefreshToken } : {})
    });
});
// Add logout endpoint to clear cookies
exports.logout = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    // Clear auth cookies
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
    // Send success response
    apiResponse_1.ApiResponse.success(res, 200, 'Logged out successfully', {});
});
// Add endpoint to validate current session
exports.me = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    // User should be attached by auth middleware
    if (!req.user || !req.user.id) {
        throw apiError_1.ApiError.unauthorized('Not authenticated');
    }
    // Get user from database to ensure they still exist
    const user = await user_1.default.findById(req.user.id);
    if (!user) {
        throw apiError_1.ApiError.unauthorized('User not found');
    }
    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    // Send user data
    apiResponse_1.ApiResponse.success(res, 200, 'User data retrieved successfully', userWithoutPassword);
});
//# sourceMappingURL=authController.js.map