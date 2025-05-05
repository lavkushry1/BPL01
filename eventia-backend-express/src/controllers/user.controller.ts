import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../utils/apiResponse';
import { ApiError } from '../utils/apiError';
import { DatabaseRequest } from '../middleware/database';

export class UserController {
  /**
   * Get all users (admin only)
   */
  static async getAllUsers(req: DatabaseRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page = 1, limit = 10, role } = req.query;
      
      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      
      const query = req.db('users')
        .select('id', 'name', 'email', 'role', 'created_at', 'updated_at');
      
      // Filter by role if provided
      if (role && typeof role === 'string') {
        query.where('role', role.toUpperCase());
      }
      
      // Get total count
      const countQuery = req.db('users');
      if (role && typeof role === 'string') {
        countQuery.where('role', role.toUpperCase());
      }
      const totalCount = await countQuery.count('id as count').first();
      
      // Apply pagination
      const users = await query
        .orderBy('created_at', 'desc')
        .offset((pageNum - 1) * limitNum)
        .limit(limitNum);
      
      ApiResponse.success(res, 200, 'Users retrieved successfully', {
        users,
        pagination: {
          total: totalCount ? Number(totalCount.count) : 0,
          page: pageNum,
          limit: limitNum
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
      const { id } = req.params;
      
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
      const { id } = req.params;
      const { name, email, role } = req.body;
      
      // Check if user exists
      const user = await req.db('users').where('id', id).first();
      
      if (!user) {
        throw new ApiError(404, 'User not found');
      }
      
      // Prepare update data
      const updateData: Record<string, any> = {};
      
      if (name) updateData.name = name;
      if (email) updateData.email = email;
      if (role) updateData.role = role.toUpperCase();
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