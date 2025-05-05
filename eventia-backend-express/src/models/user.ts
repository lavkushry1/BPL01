import { z } from 'zod';
import { db } from '../db';
import { v4 as uuidv4 } from 'uuid';

// Schema for validation
export const userSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['admin', 'user']).default('user'),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export type User = z.infer<typeof userSchema>;

export type UserWithId = User & { id: string; createdAt: Date; updatedAt: Date };

// User model class
class UserModel {
  tableName = 'users';

  async findById(id: string): Promise<UserWithId | null> {
    return await db(this.tableName).where({ id }).first();
  }

  async findByEmail(email: string): Promise<UserWithId | null> {
    return await db(this.tableName).where({ email }).first();
  }

  async create(user: User): Promise<UserWithId> {
    // Generate a UUID for the user
    const userWithId = {
      ...user,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const [newUser] = await db(this.tableName).insert(userWithId).returning('*');
    return newUser;
  }

  async update(id: string, userData: Partial<User>): Promise<UserWithId | null> {
    const [updatedUser] = await db(this.tableName)
      .where({ id })
      .update({ ...userData, updatedAt: new Date() })
      .returning('*');
    
    return updatedUser || null;
  }
}

export const userModel = new UserModel();
export default userModel;
