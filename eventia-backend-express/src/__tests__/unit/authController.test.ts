import { describe, expect, test, jest, beforeEach } from '@jest/globals';
import { Request, Response, NextFunction } from 'express';
import { register, login, refreshToken, logout, me } from '../../controllers/authController';
import { ApiResponse } from '../../utils/apiResponse';
import { ApiError } from '../../utils/apiError';
import * as userModel from '../../models/user';
import bcrypt from 'bcrypt';
import { generateToken, verifyToken } from '../../utils/jwt';
import { config } from '../../config';

// Mock modules
describe('Auth Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mocked<NextFunction>;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      cookie: jest.fn().mockReturnThis(),
      clearCookie: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('register', () => {
    test('should register new user successfully', async () => {
      mockRequest.body = { email: 'test@example.com', password: 'password123', name: 'Test User' };
      jest.spyOn(userModel, 'findByEmail').mockResolvedValue(null);
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashedPassword');
      jest.spyOn(userModel, 'create').mockResolvedValue({ id: '1', email: 'test@example.com', name: 'Test User', role: 'USER', password: 'hashedPassword' });

      await register(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'User registered successfully' }));
    });

    test('should throw error if email already exists', async () => {
      mockRequest.body = { email: 'existing@example.com', password: 'password123', name: 'Test User' };
      jest.spyOn(userModel, 'findByEmail').mockResolvedValue({ id: '1', email: 'existing@example.com', name: 'Existing', role: 'USER', password: 'hash' });

      await register(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
    });
  });

  describe('login', () => {
    test('should login successfully and set cookies', async () => {
      mockRequest.body = { email: 'test@example.com', password: 'password123' };
      const mockUser = { id: '1', email: 'test@example.com', password: 'hashedPassword', role: 'USER' };
      jest.spyOn(userModel, 'findByEmail').mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);
      jest.spyOn(require('../../utils/jwt'), 'generateToken').mockReturnValueOnce('accessToken').mockReturnValueOnce('refreshToken');

      await login(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.cookie).toHaveBeenCalledWith('access_token', 'accessToken', expect.any(Object));
      expect(mockResponse.cookie).toHaveBeenCalledWith('refresh_token', 'refreshToken', expect.any(Object));
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    test('should throw error for invalid credentials', async () => {
      mockRequest.body = { email: 'test@example.com', password: 'wrong' };
      jest.spyOn(userModel, 'findByEmail').mockResolvedValue(null);

      await login(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
    });
  });

  // Similar tests for refreshToken, logout, me

  describe('refreshToken', () => {
    test('should refresh token successfully', async () => {
      mockRequest.cookies = { refresh_token: 'validRefreshToken' };
      jest.spyOn(require('../../utils/jwt'), 'verifyToken').mockReturnValue({ id: '1' });
      const mockUser = { id: '1', email: 'test@example.com', role: 'USER' };
      jest.spyOn(userModel, 'findById').mockResolvedValue(mockUser);
      jest.spyOn(require('../../utils/jwt'), 'generateToken').mockReturnValueOnce('newAccess').mockReturnValueOnce('newRefresh');

      await refreshToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.cookie).toHaveBeenCalledWith('access_token', 'newAccess', expect.any(Object));
      expect(mockResponse.cookie).toHaveBeenCalledWith('refresh_token', 'newRefresh', expect.any(Object));
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });
  });

  describe('logout', () => {
    test('should clear cookies and logout', async () => {
      await logout(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.clearCookie).toHaveBeenCalledWith('access_token');
      expect(mockResponse.clearCookie).toHaveBeenCalledWith('refresh_token');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });
  });

  describe('me', () => {
    test('should return user data', async () => {
      mockRequest.user = { id: '1', email: 'test@example.com', role: 'USER' };
      const mockUser = { id: '1', email: 'test@example.com', role: 'USER', password: 'hash' };
      jest.spyOn(userModel, 'findById').mockResolvedValue(mockUser);

      await me(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ id: '1' }) }));
    });
  });
});