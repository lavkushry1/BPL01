import jwt from 'jsonwebtoken';
import { config } from '../config';
import { logger } from './logger';

/**
 * Generate a JWT token with enhanced security options
 * @param payload Data to include in the token
 * @param expiresIn Token expiration time (defaults to config setting)
 * @returns Signed JWT token
 */
export const generateToken = (
  payload: Record<string, any>,
  expiresIn = config.jwt.accessExpiration
): string => {
  if (!config.jwt.secret) {
    logger.error('JWT secret is not configured');
    throw new Error('JWT secret is not configured');
  }

  // Add additional claims to payload for enhanced security
  const enhancedPayload = {
    ...payload,
    aud: 'eventia-app',        // audience
    iss: 'eventia-api',        // issuer
    jti: generateTokenId(),    // unique token ID
  };

  // Use any to bypass typing issues
  const jwtSign = jwt.sign as any;
  return jwtSign(enhancedPayload, config.jwt.secret, { expiresIn });
};

/**
 * Generate a random token ID to prevent token reuse
 */
const generateTokenId = (): string => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
};

/**
 * Verify a JWT token
 * @param token JWT token to verify
 * @returns Decoded token payload or null if invalid
 */
export const verifyToken = (token: string): Record<string, any> | null => {
  if (!config.jwt.secret) {
    logger.error('JWT secret is not configured');
    throw new Error('JWT secret is not configured');
  }

  try {
    // Validate token format before verification
    if (!token || typeof token !== 'string' || !token.match(/^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.[A-Za-z0-9-_.+/=]*$/)) {
      logger.debug(`Token verification failed: invalid token format`);
      return null;
    }

    // Use any to bypass typing issues
    const jwtVerify = jwt.verify as any;
    return jwtVerify(token, config.jwt.secret, {
      audience: 'eventia-app',
      issuer: 'eventia-api',
    });
  } catch (error) {
    const errorMessage = (error as Error).message;
    logger.debug(`Token verification failed: ${errorMessage}`);
    
    // Log additional details for debugging
    if (errorMessage.includes('jwt malformed')) {
      try {
        // Log first few characters of token for debugging
        const tokenPreview = token.substring(0, 20) + '...';
        logger.debug(`Malformed token starts with: ${tokenPreview}`);
      } catch (e) {
        logger.debug('Could not log token preview');
      }
    }
    
    return null;
  }
};

/**
 * Decode a JWT token without verifying its signature
 * @param token The JWT token to decode
 * @returns Decoded token payload or null if invalid format
 */
export const decodeToken = (token: string): any | null => {
  try {
    return jwt.decode(token);
  } catch (error) {
    return null;
  }
};

export default {
  generateToken,
  verifyToken
};