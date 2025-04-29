import jwt from 'jsonwebtoken';
import { config } from '../config';

/**
 * Generate a JWT token for authentication
 * @param payload The data to include in the token
 * @param expiresIn Optional token expiration time (default from config)
 * @returns JWT token string
 * @throws Error if JWT secret is not configured
 */
export const generateToken = (
  payload: Record<string, any>,
  expiresIn: string | number = config.jwt.accessExpiration
): string => {
  if (!config.jwt.secret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }
  
  // Use 'any' type casting to bypass TypeScript checking
  // This is not ideal for type safety but resolves the immediate issue
  const jwtSign: any = jwt.sign;
  return jwtSign(payload, config.jwt.secret, { expiresIn });
};

/**
 * Verify a JWT token
 * @param token The JWT token to verify
 * @returns Decoded token payload or null if invalid
 * @throws Error if JWT secret is not configured
 */
export const verifyToken = (token: string): any | null => {
  if (!config.jwt.secret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }
  try {
    // Use 'any' type casting to bypass TypeScript checking
    const jwtVerify: any = jwt.verify;
    return jwtVerify(token, config.jwt.secret);
  } catch (error) {
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