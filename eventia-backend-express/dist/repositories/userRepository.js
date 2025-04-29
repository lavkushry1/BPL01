"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRepository = void 0;
const db_1 = require("../db");
const apiError_1 = require("../utils/apiError");
/**
 * Repository for user-related database operations
 */
class UserRepository {
    /**
     * Find a user by their email address
     * @param email The email to search for
     * @returns User object or null if not found
     */
    async findByEmail(email) {
        try {
            const user = await (0, db_1.db)('users')
                .where({ email })
                .first();
            return user || null;
        }
        catch (error) {
            console.error('Error finding user by email:', error);
            throw new apiError_1.ApiError(500, 'Database error when finding user');
        }
    }
    /**
     * Find a user by their ID
     * @param id The user ID to search for
     * @returns User object or null if not found
     */
    async findById(id) {
        try {
            const user = await (0, db_1.db)('users')
                .where({ id })
                .first();
            return user || null;
        }
        catch (error) {
            console.error('Error finding user by ID:', error);
            throw new apiError_1.ApiError(500, 'Database error when finding user');
        }
    }
    /**
     * Create a new user
     * @param userData The user data to insert
     * @returns The created user
     */
    async create(userData) {
        try {
            const [user] = await (0, db_1.db)('users')
                .insert({
                ...userData,
                created_at: new Date(),
                updated_at: new Date()
            })
                .returning('*');
            return user;
        }
        catch (error) {
            console.error('Error creating user:', error);
            throw new apiError_1.ApiError(500, 'Database error when creating user');
        }
    }
    /**
     * Update an existing user
     * @param id The user ID to update
     * @param userData The updated user data
     * @returns The updated user
     */
    async update(id, userData) {
        try {
            const [user] = await (0, db_1.db)('users')
                .where({ id })
                .update({
                ...userData,
                updated_at: new Date()
            })
                .returning('*');
            if (!user) {
                throw new apiError_1.ApiError(404, 'User not found');
            }
            return user;
        }
        catch (error) {
            if (error instanceof apiError_1.ApiError) {
                throw error;
            }
            console.error('Error updating user:', error);
            throw new apiError_1.ApiError(500, 'Database error when updating user');
        }
    }
    /**
     * Delete a user
     * @param id The user ID to delete
     * @returns Boolean indicating success
     */
    async delete(id) {
        try {
            const deletedCount = await (0, db_1.db)('users')
                .where({ id })
                .delete();
            return deletedCount > 0;
        }
        catch (error) {
            console.error('Error deleting user:', error);
            throw new apiError_1.ApiError(500, 'Database error when deleting user');
        }
    }
}
exports.UserRepository = UserRepository;
