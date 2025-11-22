import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import bcrypt from 'bcryptjs';
import { NextFunction, Request, Response } from 'express';
import { login, logout, me, refreshToken, register } from '../../controllers/authController';
import userModel from '../../models/user';
import { ApiError } from '../../utils/apiError';

// Mock modules
jest.mock('../../services/job.service');

describe('Auth Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mocked<NextFunction>;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis() as any,
      json: jest.fn().mockReturnThis() as any,
      cookie: jest.fn().mockReturnThis() as any,
      clearCookie: jest.fn().mockReturnThis() as any,
    };
    mockNext = jest.fn() as unknown as jest.Mocked<NextFunction>;
    jest.clearAllMocks();
  });

  describe('register', () => {
    test('should register new user successfully', async () => {
      mockRequest.body = { email: 'test@example.com', password: 'password123', name: 'Test User' };
      jest.spyOn(userModel, 'findByEmail').mockResolvedValue(null);
      (jest.spyOn(bcrypt, 'hash') as any).mockResolvedValue('hashedPassword');
      jest.spyOn(userModel, 'create').mockResolvedValue({
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'USER',
        password: 'hashedPassword',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await register(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'User registered successfully' }));
    });

    test('should throw error if email already exists', async () => {
      mockRequest.body = { email: 'existing@example.com', password: 'password123', name: 'Test User' };
      jest.spyOn(userModel, 'findByEmail').mockResolvedValue({
        id: '1',
        email: 'existing@example.com',
        name: 'Existing',
        role: 'USER',
        password: 'hash',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await register(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
    });
  });

  describe('login', () => {
    test('should login successfully and set cookies', async () => {
      mockRequest.body = { email: 'test@example.com', password: 'password123' };
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        password: 'hashedPassword',
        role: 'USER' as const,
        name: 'Test User',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      jest.spyOn(userModel, 'findByEmail').mockResolvedValue(mockUser);
      (jest.spyOn(bcrypt, 'compare') as any).mockResolvedValue(true);
      jest.spyOn(require('../../utils/jwt'), 'generateToken').mockReturnValueOnce('accessToken').mockReturnValueOnce('refreshToken');

      await login(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.cookie).toHaveBeenCalledWith('access_token', 'accessToken', expect.any(Object));
      expect(mockResponse.cookie).toHaveBeenCalledWith('refresh_token', 'refreshToken', expect.any(Object));
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    test('should throw error for invalid credentials', async () => {
      mockRequest.body = { email: 'test@example.com', password: 'wrong' };
      jest.spyOn(userModel, 'findByEmail').mockResolvedValue(null);
      (jest.spyOn(bcrypt, 'compare') as any).mockResolvedValue(false);

      await login(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
    });
  });

  // Similar tests for refreshToken, logout, me

  describe('refreshToken', () => {
    test('should refresh token successfully', async () => {
      mockRequest.cookies = { refresh_token: 'valid.refresh.token' };
      jest.spyOn(require('../../utils/jwt'), 'verifyToken').mockReturnValue({ id: '1' });
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        role: 'USER' as const,
        name: 'Test User',
        password: 'hashedPassword',
        createdAt: new Date(),
        updatedAt: new Date()
      };
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
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        role: 'USER' as const,
        password: 'hash',
        name: 'Test User',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      jest.spyOn(userModel, 'findById').mockResolvedValue(mockUser);

      await me(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ id: '1' }) }));
    });
  });
});
