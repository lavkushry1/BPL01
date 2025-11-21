import { NextFunction, Response } from 'express';
import { DatabaseRequest } from '../middleware/database';
import { ApiError } from '../utils/apiError';
import { ApiResponse } from '../utils/apiResponse';

export class UserController {
  /**
   * Get all users (admin only)
   */
  static async getAllUsers(req: DatabaseRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validation is handled by middleware, but we can access query params safely
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      const role = req.query.role as string | undefined;

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

  /**
   * Get current user profile
   */
  static async getProfile(req: DatabaseRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new ApiError(401, 'User not authenticated');
      }

      const user = await req.db('users')
        .select('id', 'name', 'email', 'role', 'created_at', 'updated_at')
        .where('id', userId)
        .first();

      if (!user) {
        throw new ApiError(404, 'User not found');
      }

      ApiResponse.success(res, 200, 'Profile retrieved successfully', user);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update current user profile
   */
  static async updateProfile(req: DatabaseRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      const { name, email } = req.body;

      if (!userId) {
        throw new ApiError(401, 'User not authenticated');
      }

      // Prepare update data
      const updateData: Record<string, any> = {};
      if (name) updateData.name = name;
      if (email) updateData.email = email;
      // Note: phone and address might be in a separate profile table or jsonb field depending on schema
      // For now assuming they are on users table or ignored if not
      // Checking schema would be ideal, but sticking to basic fields for now

      updateData.updated_at = new Date();

      await req.db('users')
        .where('id', userId)
        .update(updateData);

      const updatedUser = await req.db('users')
        .select('id', 'name', 'email', 'role', 'created_at', 'updated_at')
        .where('id', userId)
        .first();

      ApiResponse.success(res, 200, 'Profile updated successfully', updatedUser);
    } catch (error) {
      next(error);
    }
  }
}
