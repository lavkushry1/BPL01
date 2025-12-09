import { db } from '../db';
import { ApiError } from '../utils/apiError';

/**
 * User interface representing a user in the database
 */
export interface User {
  id: number | string;
  email: string;
  password: string;
  name?: string;
  role: string;
  created_at?: Date;
  updated_at?: Date;
}

/**
 * Repository for user-related database operations
 */
export class UserRepository {
  /**
   * Find a user by their email address
   * @param email The email to search for
   * @returns User object or null if not found
   */
  async findByEmail(email: string): Promise<User | null> {
    try {
      const user = await db('users')
        .where({ email })
        .first();
      
      return user || null;
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw new ApiError(500, 'Database error when finding user');
    }
  }

  /**
   * Find a user by their ID
   * @param id The user ID to search for
   * @returns User object or null if not found
   */
  async findById(id: number | string): Promise<User | null> {
    try {
      const user = await db('users')
        .where({ id })
        .first();
      
      return user || null;
    } catch (error) {
      console.error('Error finding user by ID:', error);
      throw new ApiError(500, 'Database error when finding user');
    }
  }

  /**
   * Create a new user
   * @param userData The user data to insert
   * @returns The created user
   */
  async create(userData: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User> {
    try {
      const [user] = await db('users')
        .insert({
          ...userData,
          created_at: new Date(),
          updated_at: new Date()
        })
        .returning('*');
      
      return user;
    } catch (error) {
      console.error('Error creating user:', error);
      throw new ApiError(500, 'Database error when creating user');
    }
  }

  /**
   * Update an existing user
   * @param id The user ID to update
   * @param userData The updated user data
   * @returns The updated user
   */
  async update(id: number | string, userData: Partial<Omit<User, 'id' | 'created_at'>>): Promise<User> {
    try {
      const [user] = await db('users')
        .where({ id })
        .update({
          ...userData,
          updated_at: new Date()
        })
        .returning('*');
      
      if (!user) {
        throw new ApiError(404, 'User not found');
      }
      
      return user;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      console.error('Error updating user:', error);
      throw new ApiError(500, 'Database error when updating user');
    }
  }

  /**
   * Delete a user
   * @param id The user ID to delete
   * @returns Boolean indicating success
   */
  async delete(id: number | string): Promise<boolean> {
    try {
      const deletedCount = await db('users')
        .where({ id })
        .delete();
      
      return deletedCount > 0;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw new ApiError(500, 'Database error when deleting user');
    }
  }
}