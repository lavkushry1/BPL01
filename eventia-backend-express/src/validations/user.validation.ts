import { z } from 'zod';

const roleSchema = z.enum(['USER', 'ADMIN', 'MANAGER']);

export const getAllUsersQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    role: roleSchema.optional()
  })
});

export const getUserParamsSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid user ID format')
  })
});

export const updateUserSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid user ID format')
  }),
  body: z.object({
    name: z.string().min(3, 'Name must be at least 3 characters').max(100).optional(),
    email: z.string().email('Invalid email format').optional(),
    role: roleSchema.optional()
  })
});

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(3, 'Name must be at least 3 characters').max(100).optional(),
    email: z.string().email('Invalid email format').optional(),
    phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format').optional(),
    address: z.string().min(5, 'Address must be at least 5 characters').optional()
  })
});
