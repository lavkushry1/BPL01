import bcrypt from 'bcryptjs';
import { Request, Response } from 'express';
import { config } from '../config';
import userModel, { loginSchema, registerSchema } from '../models/user';
import { ApiError } from '../utils/apiError';
import { ApiResponse } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { generateToken, verifyToken } from '../utils/jwt';
import { logger } from '../utils/logger';

export const register = asyncHandler(async (
  req: Request,
  res: Response
): Promise<void> => {
  const { email, password, name } = registerSchema.parse(req.body);

  // Check if user already exists
  const existingUser = await userModel.findByEmail(email);
  if (existingUser) {
    throw ApiError.conflict('Email already in use');
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12);

  // Create user in database with enforced USER role
  const newUser = await userModel.create({
    email,
    name,
    password: hashedPassword,
    role: 'USER',
  });

  // Remove password from response
  const { password: _, ...userWithoutPassword } = newUser;

  // Send response
  ApiResponse.created(res, userWithoutPassword, 'User registered successfully');
});

export const login = asyncHandler(async (
  req: Request,
  res: Response
): Promise<void> => {
  const { email, password } = loginSchema.parse(req.body);

  // Find user by email
  const user = await userModel.findByEmail(email);
  if (!user) {
    throw ApiError.unauthorized('Invalid credentials');
  }

  // Check password
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    // Log failed login attempt
    logger.warn(`Failed login attempt for user: ${email}`);
    throw ApiError.unauthorized('Invalid credentials');
  }

  // Generate JWT token using our utility
  const token = generateToken({
    id: user.id,
    email: user.email,
    role: user.role
  }, config.jwt.accessExpiration);

  // Generate refresh token
  const refreshToken = generateToken(
    { id: user.id },
    config.jwt.refreshExpiration
  );

  // Remove password from response
  const { password: _, ...userWithoutPassword } = user;

  // Set tokens in HttpOnly cookies
  res.cookie('access_token', token, {
    httpOnly: true,
    secure: config.isProduction, // Secure in production
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 1 day in milliseconds
  });

  res.cookie('refresh_token', refreshToken, {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: 'lax',
    path: '/api/v1/auth/refresh-token', // Restrict to refresh endpoint
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
  });

  // Send response with user data but without tokens in body for security
  ApiResponse.success(res, 200, 'Login successful', {
    user: userWithoutPassword,
    // Include tokens in dev environment for testing but not in production
    ...(config.isDevelopment ? { token, refreshToken } : {})
  });
});

export const refreshToken = asyncHandler(async (
  req: Request,
  res: Response
): Promise<void> => {
  // Get refresh token from cookie or request body (for backward compatibility)
  const tokenFromCookie = req.cookies.refresh_token;
  const tokenFromBody = req.body.refreshToken;
  const refreshToken = tokenFromCookie || tokenFromBody;

  if (!refreshToken) {
    throw ApiError.badRequest('Refresh token is required');
  }

  // Log token debug info
  const tokenType = typeof refreshToken;
  const tokenLength = refreshToken ? refreshToken.length : 0;
  logger.debug(`Refresh token type: ${tokenType}, length: ${tokenLength}`);

  // Basic format validation
  if (typeof refreshToken !== 'string' || !refreshToken.includes('.')) {
    logger.debug('Token format validation failed: not a valid JWT structure');
    throw ApiError.unauthorized('Invalid refresh token format');
  }

  // Verify token using our utility
  const decoded = verifyToken(refreshToken) as { id: string } | null;
  if (!decoded) {
    logger.debug('Token verification returned null');
    throw ApiError.unauthorized('Invalid refresh token');
  }

  // Find user
  const user = await userModel.findById(decoded.id);
  if (!user) {
    logger.debug(`User not found for id: ${decoded.id}`);
    throw ApiError.unauthorized('Invalid refresh token');
  }

  // Generate new tokens using our utility
  const newToken = generateToken({
    id: user.id,
    email: user.email,
    role: user.role
  }, config.jwt.accessExpiration);

  const newRefreshToken = generateToken(
    { id: user.id },
    config.jwt.refreshExpiration
  );

  // Set new tokens in HttpOnly cookies
  res.cookie('access_token', newToken, {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 1 day
  });

  res.cookie('refresh_token', newRefreshToken, {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: 'lax',
    path: '/api/v1/auth/refresh-token',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  // Remove password from response
  const { password: _, ...userWithoutPassword } = user;

  // Send response
  ApiResponse.success(res, 200, 'Token refreshed successfully', {
    // Frontend expects 'accessToken' not 'token'
    accessToken: newToken,
    user: userWithoutPassword,
    // Include tokens in development for testing but not in production
    ...(config.isDevelopment ? { refreshToken: newRefreshToken } : {})
  });
});

// Add logout endpoint to clear cookies
export const logout = asyncHandler(async (
  req: Request,
  res: Response
): Promise<void> => {
  // Clear auth cookies
  res.clearCookie('access_token');
  res.clearCookie('refresh_token');

  // Send success response
  ApiResponse.success(res, 200, 'Logged out successfully', {});
});

// Add endpoint to validate current session
export const me = asyncHandler(async (
  req: Request,
  res: Response
): Promise<void> => {
  // User should be attached by auth middleware
  if (!req.user || !req.user.id) {
    throw ApiError.unauthorized('Not authenticated');
  }

  // Get user from database to ensure they still exist
  const user = await userModel.findById(req.user.id);
  if (!user) {
    throw ApiError.unauthorized('User not found');
  }

  // Remove password from response
  const { password: _, ...userWithoutPassword } = user;

  // Send user data
  ApiResponse.success(res, 200, 'User data retrieved successfully', userWithoutPassword);
});
