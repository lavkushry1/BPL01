"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userModel = exports.loginSchema = exports.userSchema = void 0;
const zod_1 = require("zod");
const db_1 = require("../db");
const uuid_1 = require("uuid");
// Schema for validation
exports.userSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).max(100),
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8),
    role: zod_1.z.enum(['admin', 'user']).default('user'),
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
