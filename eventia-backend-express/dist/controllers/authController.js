"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshToken = exports.login = exports.register = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const apiResponse_1 = require("../utils/apiResponse");
const apiError_1 = require("../utils/apiError");
const jwt_1 = require("../utils/jwt");
const config_1 = require("../config");
const user_1 = __importDefault(require("../models/user"));
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
        // Create user in database
        const newUser = await user_1.default.create({
            email,
            name,
            password: hashedPassword,
            role,
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
            throw apiError_1.ApiError.unauthorized('Invalid credentials');
        }
        // Generate JWT token using our utility
        const token = (0, jwt_1.generateToken)({
            id: user.id,
            email: user.email,
            role: user.role
        });
        // Generate refresh token
        const refreshToken = (0, jwt_1.generateToken)({ id: user.id }, config_1.config.jwt.refreshExpiration);
        // Remove password from response
        const { password: _, ...userWithoutPassword } = user;
        // Send response
        apiResponse_1.ApiResponse.success(res, {
            user: userWithoutPassword,
            token,
            refreshToken,
        }, 'Login successful');
    }
    catch (error) {
        next(error);
    }
};
exports.login = login;
const refreshToken = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            throw apiError_1.ApiError.badRequest('Refresh token is required');
        }
        try {
            // Verify refresh token using our utility
            const decoded = (0, jwt_1.verifyToken)(refreshToken);
            if (!decoded) {
                throw apiError_1.ApiError.unauthorized('Invalid refresh token');
            }
            // Find user
            const user = await user_1.default.findById(decoded.id);
            if (!user) {
                throw apiError_1.ApiError.unauthorized('Invalid refresh token');
            }
            // Generate new tokens using our utility
            const newToken = (0, jwt_1.generateToken)({
                id: user.id,
                email: user.email,
                role: user.role
            });
            const newRefreshToken = (0, jwt_1.generateToken)({ id: user.id }, config_1.config.jwt.refreshExpiration);
            // Send response
            apiResponse_1.ApiResponse.success(res, {
                token: newToken,
                refreshToken: newRefreshToken
            }, 'Token refreshed successfully');
        }
        catch (error) {
            throw apiError_1.ApiError.unauthorized('Invalid refresh token');
        }
    }
    catch (error) {
        next(error);
    }
};
exports.refreshToken = refreshToken;
