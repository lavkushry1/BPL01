"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.decodeToken = exports.verifyToken = exports.generateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../config");
/**
 * Generate a JWT token for authentication
 * @param payload The data to include in the token
 * @param expiresIn Optional token expiration time (default from config)
 * @returns JWT token string
 * @throws Error if JWT secret is not configured
 */
const generateToken = (payload, expiresIn = config_1.config.jwt.accessExpiration) => {
    if (!config_1.config.jwt.secret) {
        throw new Error('JWT_SECRET is not defined in environment variables');
    }
    // Use 'any' type casting to bypass TypeScript checking
    // This is not ideal for type safety but resolves the immediate issue
    const jwtSign = jsonwebtoken_1.default.sign;
    return jwtSign(payload, config_1.config.jwt.secret, { expiresIn });
};
exports.generateToken = generateToken;
/**
 * Verify a JWT token
 * @param token The JWT token to verify
 * @returns Decoded token payload or null if invalid
 * @throws Error if JWT secret is not configured
 */
const verifyToken = (token) => {
    if (!config_1.config.jwt.secret) {
        throw new Error('JWT_SECRET is not defined in environment variables');
    }
    try {
        // Use 'any' type casting to bypass TypeScript checking
        const jwtVerify = jsonwebtoken_1.default.verify;
        return jwtVerify(token, config_1.config.jwt.secret);
    }
    catch (error) {
        return null;
    }
};
exports.verifyToken = verifyToken;
/**
 * Decode a JWT token without verifying its signature
 * @param token The JWT token to decode
 * @returns Decoded token payload or null if invalid format
 */
const decodeToken = (token) => {
    try {
        return jsonwebtoken_1.default.decode(token);
    }
    catch (error) {
        return null;
    }
};
exports.decodeToken = decodeToken;
