"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.me = exports.logout = exports.refreshToken = exports.login = exports.register = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const apiResponse_1 = require("../utils/apiResponse");
const apiError_1 = require("../utils/apiError");
const jwt_1 = require("../utils/jwt");
const config_1 = require("../config");
const user_1 = __importDefault(require("../models/user"));
const logger_1 = require("../utils/logger");
const register = async (req, res, next) => {
    try {
        const { email, password, name, role = 'user' } = req.body;
        // Check if user already exists
        const existingUser = await user_1.default.findByEmail(email);
        if (existingUser) {
            throw apiError_1.ApiError.conflict('Email already in use');
        }
        // Hash password
        const hashedPassword = await bcrypt_1.default.hash(password, 12);
        // Convert role to uppercase to match Prisma enum
        const prismaRole = role.toUpperCase();
        // Create user in database
        const newUser = await user_1.default.create({
            email,
            name,
            password: hashedPassword,
            role: prismaRole,
        });
        // Remove password from response
        const { password: _, ...userWithoutPassword } = newUser;
        // Send response
        apiResponse_1.ApiResponse.created(res, userWithoutPassword, 'User registered successfully');
    }
    catch (error) {
        next(error);
    }
};
exports.register = register;
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        // Find user by email
        const user = await user_1.default.findByEmail(email);
        if (!user) {
            throw apiError_1.ApiError.unauthorized('Invalid credentials');
        }
        // Check password
        const isPasswordValid = await bcrypt_1.default.compare(password, user.password);
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
    }
    catch (error) {
        next(error);
    }
};
exports.login = login;
const refreshToken = async (req, res, next) => {
    try {
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
        // Send response
        apiResponse_1.ApiResponse.success(res, 200, 'Token refreshed successfully', {
            // Include tokens in development for testing but not in production
            ...(config_1.config.isDevelopment ? { token: newToken, refreshToken: newRefreshToken } : {})
        });
    }
    catch (error) {
        logger_1.logger.error('Refresh token error:', error);
        next(error);
    }
};
exports.refreshToken = refreshToken;
// Add logout endpoint to clear cookies
const logout = async (req, res, next) => {
    try {
        // Clear auth cookies
        res.clearCookie('access_token');
        res.clearCookie('refresh_token');
        // Send success response
        apiResponse_1.ApiResponse.success(res, 200, 'Logged out successfully', {});
    }
    catch (error) {
        logger_1.logger.error('Logout error:', error);
        next(error);
    }
};
exports.logout = logout;
// Add endpoint to validate current session
const me = async (req, res, next) => {
    try {
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
    }
    catch (error) {
        next(error);
    }
};
exports.me = me;
//# sourceMappingURL=authController.js.map