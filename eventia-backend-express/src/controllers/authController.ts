import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { ApiResponse } from '../utils/apiResponse';
import { ApiError } from '../utils/apiError';
import { generateToken, verifyToken } from '../utils/jwt';
import { config } from '../config';
import userModel, { userSchema, loginSchema } from '../models/user';

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password, name, role = 'user' } = req.body;
    
    // Check if user already exists
    const existingUser = await userModel.findByEmail(email);
    if (existingUser) {
      throw ApiError.conflict('Email already in use');
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Create user in database
    const newUser = await userModel.create({
      email,
      name,
      password: hashedPassword,
      role,
    });
    
    // Remove password from response
    const { password: _, ...userWithoutPassword } = newUser;
    
    // Send response
    ApiResponse.created(res, userWithoutPassword, 'User registered successfully');
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body;
    
    // Dummy login for testing purposes
    if (email === 'admin@example.com' && password === 'password123') {
      const token = generateToken({ 
        id: '0000-0000', 
        email: 'admin@example.com',
        role: 'admin' 
      });
      
      // Generate refresh token
      const refreshToken = generateToken(
        { id: '0000-0000' },
        config.jwt.refreshExpiration
      );
      
      // Send response with dummy user
      ApiResponse.success(res, {
        user: {
          id: '0000-0000',
          email: 'admin@example.com',
          name: 'Admin User',
          role: 'admin'
        },
        token,
        refreshToken,
      }, 'Login successful');
      return;
    }
    
    // Find user by email
    const user = await userModel.findByEmail(email);
    if (!user) {
      throw ApiError.unauthorized('Invalid credentials');
    }
    
    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw ApiError.unauthorized('Invalid credentials');
    }
    
    // Generate JWT token using our utility
    const token = generateToken({ 
      id: user.id, 
      email: user.email,
      role: user.role 
    });
    
    // Generate refresh token
    const refreshToken = generateToken(
      { id: user.id },
      config.jwt.refreshExpiration
    );
    
    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    
    // Send response
    ApiResponse.success(res, {
      user: userWithoutPassword,
      token,
      refreshToken,
    }, 'Login successful');
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      throw ApiError.badRequest('Refresh token is required');
    }
    
    try {
      // Verify refresh token using our utility
      const decoded = verifyToken(refreshToken) as { id: number } | null;
      if (!decoded) {
        throw ApiError.unauthorized('Invalid refresh token');
      }
      
      // Find user
      const user = await userModel.findById(decoded.id);
      if (!user) {
        throw ApiError.unauthorized('Invalid refresh token');
      }
      
      // Generate new tokens using our utility
      const newToken = generateToken({
        id: user.id, 
        email: user.email,
        role: user.role 
      });
      
      const newRefreshToken = generateToken(
        { id: user.id },
        config.jwt.refreshExpiration
      );
      
      // Send response
      ApiResponse.success(res, {
        token: newToken,
        refreshToken: newRefreshToken
      }, 'Token refreshed successfully');
    } catch (error) {
      throw ApiError.unauthorized('Invalid refresh token');
    }
  } catch (error) {
    next(error);
  }
};
