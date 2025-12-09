"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const apiError_1 = require("../utils/apiError");
const logger_1 = require("../utils/logger");
const prisma_1 = require("../db/prisma");
class DynamicPricingService {
    /**
     * Calculate the dynamic price for tickets based on various factors
     */
    async calculatePrice(eventId, ticketCategoryId, quantity = 1, options = {}) {
        try {
            // Set default options
            const { applyMinimumPrice = true, minimumPricePercentage = 70, logCalculation = true } = options;
            // Get ticket category to determine base price
            const ticketCategory = await prisma_1.prisma.ticketCategory.findUnique({
                where: { id: ticketCategoryId },
                include: { event: true }
            });
            if (!ticketCategory) {
                throw new apiError_1.ApiError(404, 'Ticket category not found');
            }
            const basePrice = Number(ticketCategory.price);
            // Get applicable pricing rules
            const pricingRules = await this.getApplicablePricingRules(eventId);
            // Start with the base price
            let finalPrice = basePrice;
            const adjustments = [];
            // Sort rules by priority (higher priority first)
            const sortedRules = [...pricingRules].sort((a, b) => b.priority - a.priority);
            // Apply each rule
            for (const rule of sortedRules) {
                if (!rule.isActive)
                    continue;
                const shouldApply = await this.evaluateRuleConditions(rule, {
                    eventId,
                    ticketCategoryId,
                    quantity,
                    basePrice,
                    currentPrice: finalPrice
                });
                if (!shouldApply)
                    continue;
                // Calculate adjustment
                let adjustmentAmount = 0;
                if (rule.adjustmentType === 'PERCENTAGE') {
                    adjustmentAmount = (finalPrice * (rule.adjustmentValue / 100));
                }
                else { // FIXED
                    adjustmentAmount = rule.adjustmentValue;
                }
                finalPrice -= adjustmentAmount;
                adjustments.push({
                    ruleId: rule.id,
                    ruleName: rule.name,
                    adjustmentType: rule.adjustmentType,
                    adjustmentValue: rule.adjustmentValue,
                    appliedAmount: adjustmentAmount
                });
            }
            // Apply minimum price constraint if enabled
            if (applyMinimumPrice) {
                const minimumPrice = basePrice * (minimumPricePercentage / 100);
                if (finalPrice < minimumPrice) {
                    finalPrice = minimumPrice;
                }
            }
            // Round to 2 decimal places
            finalPrice = Math.round(finalPrice * 100) / 100;
            const result = {
                basePrice,
                finalPrice,
                adjustments,
                discountPercentage: basePrice > 0 ? ((basePrice - finalPrice) / basePrice) * 100 : 0,
                calculationTime: new Date()
            };
            // Log the price calculation for analytics if enabled
            if (logCalculation) {
                await this.logPriceCalculation(eventId, ticketCategoryId, result, quantity);
            }
            return result;
        }
        catch (error) {
            logger_1.logger.error('Dynamic pricing calculation error:', error);
            throw error instanceof apiError_1.ApiError
                ? error
                : new apiError_1.ApiError(500, 'Failed to calculate dynamic pricing');
        }
    }
    /**
     * Evaluate if a rule should be applied based on its conditions
     */
    async evaluateRuleConditions(rule, context) {
        try {
            const { type, conditions } = rule;
            const { eventId, ticketCategoryId } = context;
            switch (type) {
                case 'TIME_BASED': {
                    // Check if current time is within the specified time range
                    const event = await prisma_1.prisma.event.findUnique({ where: { id: eventId } });
                    if (!event)
                        return false;
                    const currentTime = new Date();
                    const eventTime = new Date(event.startDate);
                    // Get days until event
                    const daysUntilEvent = Math.ceil((eventTime.getTime() - currentTime.getTime()) / (1000 * 60 * 60 * 24));
                    if (conditions.minDays && daysUntilEvent < conditions.minDays)
                        return false;
                    if (conditions.maxDays && daysUntilEvent > conditions.maxDays)
                        return false;
                    return true;
                }
                case 'INVENTORY_BASED': {
                    // Check if current inventory levels meet the conditions
                    const ticketCategory = await prisma_1.prisma.ticketCategory.findUnique({
                        where: { id: ticketCategoryId },
                        select: { totalSeats: true, bookedSeats: true }
                    });
                    if (!ticketCategory)
                        return false;
                    const availablePercentage = ((ticketCategory.totalSeats - ticketCategory.bookedSeats) / ticketCategory.totalSeats) * 100;
                    if (conditions.minAvailablePercentage && availablePercentage < conditions.minAvailablePercentage)
                        return false;
                    if (conditions.maxAvailablePercentage && availablePercentage > conditions.maxAvailablePercentage)
                        return false;
                    return true;
                }
                case 'DEMAND_BASED': {
                    // Check if current demand meets the conditions
                    // Demand could be measured by recent bookings
                    const recentBookingCount = await prisma_1.prisma.booking.count({
                        where: {
                            ticketCategoryId,
                            createdAt: {
                                gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
                            }
                        }
                    });
                    if (conditions.minRecentBookings && recentBookingCount < conditions.minRecentBookings)
                        return false;
                    if (conditions.maxRecentBookings && recentBookingCount > conditions.maxRecentBookings)
                        return false;
                    return true;
                }
                case 'CUSTOM': {
                    // For custom rules, we can implement specific logic based on condition types
                    // This could include special promotions, user-specific rules, etc.
                    if (conditions.customType === 'BULK_PURCHASE' && context.quantity >= conditions.minQuantity) {
                        return true;
                    }
                    if (conditions.customType === 'SPECIAL_PROMOTION' && conditions.isActive) {
                        // Check if current date is within promotion dates
                        const currentDate = new Date();
                        if (conditions.startDate && new Date(conditions.startDate) > currentDate)
                            return false;
                        if (conditions.endDate && new Date(conditions.endDate) < currentDate)
                            return false;
                        return true;
                    }
                    return false;
                }
                default:
                    return false;
            }
        }
        catch (error) {
            logger_1.logger.error(`Error evaluating pricing rule ${rule.id}:`, error);
            return false;
        }
    }
    /**
     * Get all applicable pricing rules for an event
     */
    async getApplicablePricingRules(eventId) {
        try {
            // Get both event-specific rules and global rules
            return await prisma_1.prisma.pricingRule.findMany({
                where: {
                    isActive: true,
                    OR: [
                        { eventId },
                        { isGlobal: true }
                    ]
                },
                orderBy: { priority: 'desc' }
            });
        }
        catch (error) {
            logger_1.logger.error('Error fetching pricing rules:', error);
            throw new apiError_1.ApiError(500, 'Failed to fetch pricing rules');
        }
    }
    /**
     * Log the price calculation for analytics
     */
    async logPriceCalculation(eventId, ticketCategoryId, result, quantity) {
        try {
            await prisma_1.prisma.pricingLog.create({
                data: {
                    eventId,
                    ticketCategoryId,
                    basePrice: result.basePrice,
                    finalPrice: result.finalPrice,
                    adjustments: JSON.stringify(result.adjustments),
                    quantity,
                }
            });
        }
        catch (error) {
            // Just log the error but don't fail the price calculation
            logger_1.logger.error('Failed to log price calculation:', error);
        }
    }
    /**
     * Save a new pricing rule
     */
    async savePricingRule(data) {
        try {
            return await prisma_1.prisma.pricingRule.create({
                data: {
                    ...data,
                    conditions: data.conditions || {}
                }
            });
        }
        catch (error) {
            logger_1.logger.error('Error creating pricing rule:', error);
            throw new apiError_1.ApiError(500, 'Failed to create pricing rule');
        }
    }
    /**
     * Update an existing pricing rule
     */
    async updatePricingRule(id, data) {
        try {
            return await prisma_1.prisma.pricingRule.update({
                where: { id },
                data
            });
        }
        catch (error) {
            logger_1.logger.error(`Error updating pricing rule ${id}:`, error);
            throw new apiError_1.ApiError(500, 'Failed to update pricing rule');
        }
    }
    /**
     * Delete a pricing rule
     */
    async deletePricingRule(id) {
        try {
            await prisma_1.prisma.pricingRule.delete({
                where: { id }
            });
        }
        catch (error) {
            logger_1.logger.error(`Error deleting pricing rule ${id}:`, error);
            throw new apiError_1.ApiError(500, 'Failed to delete pricing rule');
        }
    }
    /**
     * Get all pricing rules
     */
    async getPricingRules(filters = {}) {
        try {
            return await prisma_1.prisma.pricingRule.findMany({
                where: {
                    ...filters
                },
                orderBy: { priority: 'desc' }
            });
        }
        catch (error) {
            logger_1.logger.error('Error fetching pricing rules:', error);
            throw new apiError_1.ApiError(500, 'Failed to fetch pricing rules');
        }
    }
    /**
     * Get a pricing rule by ID
     */
    async getPricingRuleById(id) {
        try {
            return await prisma_1.prisma.pricingRule.findUnique({
                where: { id }
            });
        }
        catch (error) {
            logger_1.logger.error(`Error fetching pricing rule ${id}:`, error);
            throw new apiError_1.ApiError(500, 'Failed to fetch pricing rule');
        }
    }
}
exports.default = DynamicPricingService;
//# sourceMappingURL=DynamicPricingService.js.map