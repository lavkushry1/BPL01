"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiscountService = void 0;
const discountRepository_1 = require("../repositories/discountRepository");
const discountRepository = new discountRepository_1.DiscountRepository();
class DiscountService {
    /**
     * Create a new discount
     */
    static async createDiscount(data) {
        return discountRepository.create(data);
    }
    /**
     * Get discount by ID
     */
    static async getDiscountById(id) {
        return discountRepository.findById(id);
    }
    /**
     * Get discount by code
     */
    static async getDiscountByCode(code) {
        return discountRepository.findByCode(code);
    }
    /**
     * Get all discounts with pagination
     */
    static async getAllDiscounts(params) {
        const { page = 1, limit = 10, isActive, eventId, search } = params;
        const skip = (page - 1) * limit;
        const { discounts, total } = await discountRepository.findAll({
            skip,
            take: limit,
            isActive,
            eventId,
            search
        });
        const pages = Math.ceil(total / limit);
        return {
            discounts,
            total,
            pages
        };
    }
    /**
     * Update discount
     */
    static async updateDiscount(id, data) {
        return discountRepository.update(id, data);
    }
    /**
     * Delete discount
     */
    static async deleteDiscount(id) {
        return discountRepository.delete(id);
    }
    /**
     * Validate and apply discount to an order
     */
    static async applyDiscount(code, amount, eventId) {
        // Validate discount code
        const discount = await discountRepository.validate(code, amount, eventId);
        // Calculate discount amount
        const discountAmount = discountRepository.calculateDiscountAmount(discount, amount);
        // Calculate final amount
        const finalAmount = amount - discountAmount;
        return {
            discountId: discount.id,
            originalAmount: amount,
            discountAmount,
            finalAmount,
            discount
        };
    }
    /**
     * Record discount usage (called after booking is confirmed)
     */
    static async recordDiscountUsage(discountId) {
        await discountRepository.incrementUsedCount(discountId);
    }
}
exports.DiscountService = DiscountService;
