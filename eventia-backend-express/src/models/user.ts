
import { z } from 'zod';
import { db } from '../db';

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

export type UserWithId = User & { id: number; created_at: Date; updated_at: Date };

// User model class
class UserModel {
  tableName = 'users';

  async findById(id: number): Promise<UserWithId | null> {
    return await db(this.tableName).where({ id }).first();
  }

  async findByEmail(email: string): Promise<UserWithId | null> {
    return await db(this.tableName).where({ email }).first();
  }

  async create(user: User): Promise<UserWithId> {
    const [newUser] = await db(this.tableName).insert(user).returning('*');
    return newUser;
  }

  async update(id: number, userData: Partial<User>): Promise<UserWithId | null> {
    const [updatedUser] = await db(this.tableName)
      .where({ id })
      .update({ ...userData, updated_at: new Date() })
      .returning('*');
    
    return updatedUser || null;
  }
}

export const userModel = new UserModel();
export default userModel;
