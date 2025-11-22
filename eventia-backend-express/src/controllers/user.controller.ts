import { Request, Response } from 'express';
import prisma from '../db/prisma';
import { ApiError } from '../utils/apiError';
import { ApiResponse } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';

export class UserController {
  /**
   * Get all users (admin only)
   */
  static getAllUsers = asyncHandler(async (req: Request, res: Response) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const role = req.query.role as string | undefined;

    const where = role ? { role } : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.user.count({ where })
    ]);

    ApiResponse.success(res, 200, 'Users retrieved successfully', {
      users,
      pagination: {
        total,
        page,
        limit
      }
    });
  });

  /**
   * Get user by ID (admin only)
   */
  static getUserById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    ApiResponse.success(res, 200, 'User retrieved successfully', user);
  });

  /**
   * Update user (admin only)
   */
  static updateUser = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, email, role } = req.body;

    // Check if user exists
    const userExists = await prisma.user.findUnique({ where: { id } });
    if (!userExists) {
      throw new ApiError(404, 'User not found');
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        name,
        email,
        role
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });

    ApiResponse.success(res, 200, 'User updated successfully', updatedUser);
  });

  /**
   * Delete user (admin only)
   */
  static deleteUser = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    // Check if user exists
    const userExists = await prisma.user.findUnique({ where: { id } });
    if (!userExists) {
      throw new ApiError(404, 'User not found');
    }

    await prisma.user.delete({ where: { id } });

    ApiResponse.success(res, 200, 'User deleted successfully', { id });
  });

  /**
   * Get current user profile
   */
  static getProfile = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;

    if (!userId) {
      throw new ApiError(401, 'User not authenticated');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    ApiResponse.success(res, 200, 'Profile retrieved successfully', user);
  });

  /**
   * Update current user profile
   */
  static updateProfile = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    const { name, email } = req.body;

    if (!userId) {
      throw new ApiError(401, 'User not authenticated');
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        email
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });

    ApiResponse.success(res, 200, 'Profile updated successfully', updatedUser);
  });
}
