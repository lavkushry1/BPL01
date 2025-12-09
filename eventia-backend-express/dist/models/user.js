"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userModel = exports.loginSchema = exports.userSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
const db_1 = require("../db");
const uuid_1 = require("uuid");
// Schemas for validation
const passwordSchema = zod_1.z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must include an uppercase letter')
    .regex(/[a-z]/, 'Password must include a lowercase letter')
    .regex(/[0-9]/, 'Password must include a number');
const baseUserSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).max(100),
    email: zod_1.z.string().email(),
    password: passwordSchema
});
// Registration input should not allow caller-controlled roles
exports.registerSchema = baseUserSchema;
// Internal/user management schema where role can be set by trusted callers
exports.userSchema = baseUserSchema.extend({
    role: zod_1.z.enum(['USER', 'ADMIN', 'MANAGER']).default('USER'),
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string(),
});
// User model class
class UserModel {
    tableName = 'users';
    async findById(id) {
        return await (0, db_1.db)(this.tableName).where({ id }).first();
    }
    async findByEmail(email) {
        return await (0, db_1.db)(this.tableName).where({ email }).first();
    }
    async create(user) {
        // Generate a UUID for the user
        const userWithId = {
            ...user,
            role: user.role || 'USER',
            id: (0, uuid_1.v4)(),
            createdAt: new Date(),
            updatedAt: new Date()
        };
        const [newUser] = await (0, db_1.db)(this.tableName).insert(userWithId).returning('*');
        return newUser;
    }
    async update(id, userData) {
        const [updatedUser] = await (0, db_1.db)(this.tableName)
            .where({ id })
            .update({ ...userData, updatedAt: new Date() })
            .returning('*');
        return updatedUser || null;
    }
}
exports.userModel = new UserModel();
exports.default = exports.userModel;
//# sourceMappingURL=user.js.map