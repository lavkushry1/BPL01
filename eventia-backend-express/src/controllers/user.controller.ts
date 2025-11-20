import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ApiResponse } from '../utils/apiResponse';
import { ApiError } from '../utils/apiError';
import { DatabaseRequest } from '../middleware/database';

const roleSchema = z.enum(['USER', 'ADMIN', 'MANAGER']);

const getAllUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  role: roleSchema.optional()
});

const getUserParamsSchema = z.object({
  id: z.string().min(1, 'User ID is required')
});

const updateUserSchema = z.object({
  params: getUserParamsSchema,
  body: z.object({
    name: z.string().min(3, 'Name must be at least 3 characters').max(100).optional(),
    email: z.string().email('Invalid email format').optional(),
    role: roleSchema.optional()
  })
});

export class UserController {
  /**
   * Get all users (admin only)
   */
  static async getAllUsers(req: DatabaseRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit, role } = getAllUsersQuerySchema.parse(req.query);
      
      const query = req.db('users')
        .select('id', 'name', 'email', 'role', 'created_at', 'updated_at');
      
      // Filter by role if provided
      if (role) {
        query.where('role', role);
      }
      
      // Get total count
      const countQuery = req.db('users');
      if (role) {
        countQuery.where('role', role);
      }
      const totalCount = await countQuery.count('id as count').first();
      
      // Apply pagination
      const users = await query
        .orderBy('created_at', 'desc')
        .offset((page - 1) * limit)
        .limit(limit);
      
      ApiResponse.success(res, 200, 'Users retrieved successfully', {
        users,
        pagination: {
          total: totalCount ? Number(totalCount.count) : 0,
          page,
          limit
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user by ID (admin only)
   */
  static async getUserById(req: DatabaseRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = getUserParamsSchema.parse(req.params);
      
      const user = await req.db('users')
        .select('id', 'name', 'email', 'role', 'created_at', 'updated_at')
        .where('id', id)
        .first();
      
      if (!user) {
        throw new ApiError(404, 'User not found');
      }
      
      ApiResponse.success(res, 200, 'User retrieved successfully', user);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update user (admin only)
   */
  static async updateUser(req: DatabaseRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { params, body } = updateUserSchema.parse({ params: req.params, body: req.body });
      const { id } = params;
      const { name, email, role } = body;
      
      // Check if user exists
      const user = await req.db('users').where('id', id).first();
      
      if (!user) {
        throw new ApiError(404, 'User not found');
      }
      
      // Prepare update data
      const updateData: Record<string, any> = {};
      
      if (name) updateData.name = name;
      if (email) updateData.email = email;
      if (role) updateData.role = role;
      updateData.updated_at = new Date();
      
      // Update user
      await req.db('users')
        .where('id', id)
        .update(updateData);
      
      // Get updated user
      const updatedUser = await req.db('users')
        .select('id', 'name', 'email', 'role', 'created_at', 'updated_at')
        .where('id', id)
        .first();
      
      ApiResponse.success(res, 200, 'User updated successfully', updatedUser);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete user (admin only)
   */
  static async deleteUser(req: DatabaseRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      
      // Check if user exists
      const user = await req.db('users').where('id', id).first();
      
      if (!user) {
        throw new ApiError(404, 'User not found');
      }
      
      // Delete user
      await req.db('users')
        .where('id', id)
        .delete();
      
      ApiResponse.success(res, 200, 'User deleted successfully', { id });
    } catch (error) {
      next(error);
    }
  }
} 
