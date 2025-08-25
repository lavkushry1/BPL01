"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.decodeToken = exports.verifyToken = exports.generateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../config");
const logger_1 = require("./logger");
/**
 * Generate a JWT token with enhanced security options
 * @param payload Data to include in the token
 * @param expiresIn Token expiration time (defaults to config setting)
 * @returns Signed JWT token
 */
const generateToken = (payload, expiresIn = config_1.config.jwt.accessExpiration) => {
    if (!config_1.config.jwt.secret) {
        logger_1.logger.error('JWT secret is not configured');
        throw new Error('JWT secret is not configured');
    }
    // Add additional claims to payload for enhanced security
    const enhancedPayload = {
        ...payload,
        aud: 'eventia-app', // audience
        iss: 'eventia-api', // issuer
        jti: generateTokenId(), // unique token ID
    };
    // Use any to bypass typing issues
    const jwtSign = jsonwebtoken_1.default.sign;
    return jwtSign(enhancedPayload, config_1.config.jwt.secret, { expiresIn });
};
exports.generateToken = generateToken;
/**
 * Generate a random token ID to prevent token reuse
 */
const generateTokenId = () => {
    return Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);
};
/**
 * Verify a JWT token
 * @param token JWT token to verify
 * @returns Decoded token payload or null if invalid
 */
const verifyToken = (token) => {
    if (!config_1.config.jwt.secret) {
        logger_1.logger.error('JWT secret is not configured');
        throw new Error('JWT secret is not configured');
    }
    try {
        // Validate token format before verification
        if (!token || typeof token !== 'string' || !token.match(/^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.[A-Za-z0-9-_.+/=]*$/)) {
            logger_1.logger.debug(`Token verification failed: invalid token format`);
            return null;
        }
        // Use any to bypass typing issues
        const jwtVerify = jsonwebtoken_1.default.verify;
        return jwtVerify(token, config_1.config.jwt.secret, {
            audience: 'eventia-app',
            issuer: 'eventia-api',
        });
    }
    catch (error) {
        const errorMessage = error.message;
        logger_1.logger.debug(`Token verification failed: ${errorMessage}`);
        // Log additional details for debugging
        if (errorMessage.includes('jwt malformed')) {
            try {
                // Log first few characters of token for debugging
                const tokenPreview = token.substring(0, 20) + '...';
                logger_1.logger.debug(`Malformed token starts with: ${tokenPreview}`);
            }
            catch (e) {
                logger_1.logger.debug('Could not log token preview');
            }
        }
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
exports.default = {
    generateToken: exports.generateToken,
    verifyToken: exports.verifyToken
};
//# sourceMappingURL=jwt.js.map