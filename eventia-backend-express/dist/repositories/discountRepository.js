"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiscountRepository = void 0;
const prisma_1 = __importDefault(require("../db/prisma"));
const apiError_1 = require("../utils/apiError");
class DiscountRepository {
    /**
     * Create a new discount
     */
    async create(data) {
        const { eventIds, ...discountData } = data;
        // Check if code already exists
        const existingDiscount = await prisma_1.default.discount.findUnique({
            where: { code: data.code }
        });
        if (existingDiscount) {
            throw new apiError_1.ApiError(400, 'Discount code already exists', 'DISCOUNT_CODE_EXISTS');
        }
        // Create discount with optional event connections
        return prisma_1.default.discount.create({
            data: {
                ...discountData,
                value: typeof data.value === 'number' ? data.value : parseFloat(String(data.value)),
                minAmount: data.minAmount ? parseFloat(String(data.minAmount)) : null,
                events: eventIds ? {
                    connect: eventIds.map(id => ({ id }))
                } : undefined
            }
        });
    }
    /**
     * Get discount by id
     */
    async findById(id) {
        const discount = await prisma_1.default.discount.findUnique({
            where: { id },
            include: {
                events: {
                    select: {
                        id: true,
                        title: true
                    }
                }
            }
        });
        if (!discount) {
            throw new apiError_1.ApiError(404, 'Discount not found', 'DISCOUNT_NOT_FOUND');
        }
        return discount;
    }
    /**
     * Find discount by code
     */
    async findByCode(code) {
        return prisma_1.default.discount.findUnique({
            where: { code },
            include: {
                events: {
                    select: {
                        id: true,
                        title: true
                    }
                }
            }
        });
    }
    /**
     * Get all discounts with pagination and filtering
     */
    async findAll(params) {
        const { skip, take, isActive, eventId, search } = params;
        // Build where conditions
        const where = {};
        if (isActive !== undefined) {
            where.isActive = isActive;
        }
        if (eventId) {
            where.events = {
                some: {
                    id: eventId
                }
            };
        }
        if (search) {
            where.OR = [
                { code: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } }
            ];
        }
        const [discounts, total] = await Promise.all([
            prisma_1.default.discount.findMany({
                where,
                skip,
                take,
                orderBy: [
                    { isActive: 'desc' },
                    { endDate: 'desc' }
                ],
                include: {
                    events: {
                        select: {
                            id: true,
                            title: true
                        }
                    },
                    _count: {
                        select: {
                            bookings: true
                        }
                    }
                }
            }),
            prisma_1.default.discount.count({ where })
        ]);
        return { discounts, total };
    }
    /**
     * Update discount
     */
    async update(id, data) {
        const { eventIds, ...updateData } = data;
        // Check if discount exists
        await this.findById(id);
        // If updating code, check if new code already exists
        if (data.code) {
            const existingDiscount = await prisma_1.default.discount.findFirst({
                where: {
                    code: data.code,
                    id: { not: id }
                }
            });
            if (existingDiscount) {
                throw new apiError_1.ApiError(400, 'Discount code already exists', 'DISCOUNT_CODE_EXISTS');
            }
        }
        // Process value and minAmount fields
        const parsedData = {
            ...updateData
        };
        if (data.value !== undefined) {
            parsedData.value = typeof data.value === 'number'
                ? data.value
                : parseFloat(String(data.value));
        }
        if (data.minAmount !== undefined) {
            parsedData.minAmount = data.minAmount
                ? parseFloat(String(data.minAmount))
                : null;
        }
        // Update event relationships if provided
        if (eventIds !== undefined) {
            // If eventIds is empty array, disconnect all events
            if (eventIds.length === 0) {
                parsedData.events = {
                    set: []
                };
            }
            else {
                // Connect new events
                parsedData.events = {
                    set: eventIds.map(id => ({ id }))
                };
            }
        }
        return prisma_1.default.discount.update({
            where: { id },
            data: parsedData,
            include: {
                events: {
                    select: {
                        id: true,
                        title: true
                    }
                }
            }
        });
    }
    /**
     * Delete discount
     */
    async delete(id) {
        // Check if discount exists
        await this.findById(id);
        // Check if discount is used in any bookings
        const bookingsWithDiscount = await prisma_1.default.booking.count({
            where: { discountId: id }
        });
        if (bookingsWithDiscount > 0) {
            throw new apiError_1.ApiError(400, 'Cannot delete discount that is used in bookings', 'DISCOUNT_IN_USE');
        }
        return prisma_1.default.discount.delete({
            where: { id }
        });
    }
    /**
     * Validate if a discount can be applied
     */
    async validate(code, amount, eventId) {
        const discount = await prisma_1.default.discount.findUnique({
            where: { code },
            include: {
                events: {
                    select: {
                        id: true
                    }
                }
            }
        });
        if (!discount) {
            throw new apiError_1.ApiError(404, 'Invalid discount code', 'INVALID_DISCOUNT');
        }
        // Check if discount is active
        if (!discount.isActive) {
            throw new apiError_1.ApiError(400, 'Discount code is inactive', 'INACTIVE_DISCOUNT');
        }
        // Check if discount is still valid (date range)
        const now = new Date();
        if (now < discount.startDate || now > discount.endDate) {
            throw new apiError_1.ApiError(400, 'Discount code has expired', 'EXPIRED_DISCOUNT');
        }
        // Check if discount usage limit is reached
        if (discount.maxUses > 0 && discount.usedCount >= discount.maxUses) {
            throw new apiError_1.ApiError(400, 'Discount usage limit reached', 'DISCOUNT_LIMIT_REACHED');
        }
        // Check if minimum amount requirement is met
        if (discount.minAmount && amount < discount.minAmount.toNumber()) {
            throw new apiError_1.ApiError(400, `Minimum purchase amount of ${discount.minAmount} required`, 'MINIMUM_AMOUNT_NOT_MET');
        }
        // Check if discount is valid for specific event (if eventId is provided)
        if (eventId && discount.events.length > 0) {
            const eventIds = discount.events.map(e => e.id);
            if (!eventIds.includes(eventId)) {
                throw new apiError_1.ApiError(400, 'Discount not valid for this event', 'DISCOUNT_EVENT_MISMATCH');
            }
        }
        return discount;
    }
    /**
     * Increment used count for a discount
     */
    async incrementUsedCount(id) {
        return prisma_1.default.discount.update({
            where: { id },
            data: {
                usedCount: {
                    increment: 1
                }
            }
        });
    }
    /**
     * Calculate discount amount
     */
    calculateDiscountAmount(discount, originalAmount) {
        if (discount.type === 'PERCENTAGE') {
            // Calculate percentage discount
            return (originalAmount * discount.value.toNumber()) / 100;
        }
        else {
            // Fixed amount discount
            return Math.min(originalAmount, discount.value.toNumber());
        }
    }
}
exports.DiscountRepository = DiscountRepository;
//# sourceMappingURL=discountRepository.js.map