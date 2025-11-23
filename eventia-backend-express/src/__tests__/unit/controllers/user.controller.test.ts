import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { NextFunction, Request, Response } from 'express';
import { UserControllerV1 } from '../../../controllers/v1/user.controller';
import { prisma } from '../../../db/prisma';
import { ApiError } from '../../../utils/apiError';

// Mock Prisma
jest.mock('../../../db/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      delete: jest.fn(),
    },
    userProfile: {
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
    ticket: {
      findMany: jest.fn(),
    }
  },
}));

describe('UserControllerV1 Unit Tests', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mocked<NextFunction>;

  beforeEach(() => {
    mockRequest = {
      body: {},
      params: {},
      query: {},
      user: { id: 'user-123', role: 'USER' } as any,
    };
    mockResponse = {
      status: jest.fn().mockReturnThis() as any,
      json: jest.fn().mockReturnThis() as any,
    };
    mockNext = jest.fn() as unknown as jest.Mocked<NextFunction>;
    jest.clearAllMocks();
  });

  describe('getProfile', () => {
    test('should return full profile for a "Real" user with all data', async () => {
      // Mock "Real" user data
      const realUser = {
        id: 'user-123',
        email: 'real.user@example.com',
        name: 'Real User',
        role: 'USER',
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-02'),
        profile: {
          id: 'profile-123',
          userId: 'user-123',
          street: '123 Real St',
          city: 'Real City',
          state: 'Real State',
          country: 'Real Country',
          postalCode: '12345'
        }
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(realUser);

      await UserControllerV1.getProfile(mockRequest as Request, mockResponse as Response, mockNext);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        include: { profile: true }
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          email: 'real.user@example.com',
          profile: expect.objectContaining({
            city: 'Real City'
          })
        })
      }));
    });

    test('should return basic profile for a "Dummy" user with minimal data', async () => {
      // Mock "Dummy" user data (minimal)
      const dummyUser = {
        id: 'user-123',
        email: 'dummy@example.com',
        name: 'Dummy User',
        role: 'USER',
        createdAt: new Date(),
        updatedAt: new Date(),
        profile: null // No profile
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(dummyUser);

      await UserControllerV1.getProfile(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          email: 'dummy@example.com',
          profile: null
        })
      }));
    });

    test('should throw 404 if user not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await UserControllerV1.getProfile(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
      const error = mockNext.mock.calls[0][0] as ApiError;
      expect(error.statusCode).toBe(404);
    });
  });

  describe('updateProfile', () => {
    test('should update profile for "Real" user', async () => {
      mockRequest.body = {
        name: 'Updated Name',
        address: {
          street: '456 New St',
          city: 'New City'
        }
      };

      const existingUser = { id: 'user-123', email: 'test@example.com' };
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(existingUser);

      (prisma.user.update as jest.Mock).mockResolvedValue({
        ...existingUser,
        name: 'Updated Name'
      });

      (prisma.userProfile.findUnique as jest.Mock).mockResolvedValue({ id: 'profile-1' });
      (prisma.userProfile.update as jest.Mock).mockResolvedValue({
        id: 'profile-1',
        street: '456 New St',
        city: 'New City'
      });

      await UserControllerV1.updateProfile(mockRequest as Request, mockResponse as Response, mockNext);

      expect(prisma.user.update).toHaveBeenCalled();
      expect(prisma.userProfile.update).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });
  });
});
