import { z } from 'zod';
import { db } from '../db';
import { v4 as uuidv4 } from 'uuid';

// Schemas for validation
const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must include an uppercase letter')
  .regex(/[a-z]/, 'Password must include a lowercase letter')
  .regex(/[0-9]/, 'Password must include a number');

const baseUserSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: passwordSchema
});

// Registration input should not allow caller-controlled roles
export const registerSchema = baseUserSchema;

// Internal/user management schema where role can be set by trusted callers
export const userSchema = baseUserSchema.extend({
  role: z.enum(['USER', 'ADMIN', 'MANAGER']).default('USER'),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export type NewUser = z.infer<typeof userSchema>;
export type RegistrationInput = z.infer<typeof registerSchema>;

export type UserWithId = NewUser & { id: string; createdAt: Date; updatedAt: Date };

// User model class
class UserModel {
  tableName = 'users';

  async findById(id: string): Promise<UserWithId | null> {
    return await db(this.tableName).where({ id }).first();
  }

  async findByEmail(email: string): Promise<UserWithId | null> {
    return await db(this.tableName).where({ email }).first();
  }

  async create(user: NewUser): Promise<UserWithId> {
    // Generate a UUID for the user
    const userWithId = {
      ...user,
      role: user.role || 'USER',
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const [newUser] = await db(this.tableName).insert(userWithId).returning('*');
    return newUser;
  }

  async update(id: string, userData: Partial<NewUser>): Promise<UserWithId | null> {
    const [updatedUser] = await db(this.tableName)
      .where({ id })
      .update({ ...userData, updatedAt: new Date() })
      .returning('*');
    
    return updatedUser || null;
  }
}

export const userModel = new UserModel();
export default userModel;
