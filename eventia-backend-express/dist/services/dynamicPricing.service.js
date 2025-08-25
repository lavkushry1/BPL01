"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DynamicPricingService = void 0;
const prisma_1 = __importDefault(require("../db/prisma"));
const apiError_1 = require("../utils/apiError");
/**
 * Dynamic Pricing Engine
 *
 * This service calculates ticket prices dynamically based on various factors:
 * - Time to event (early bird, last minute)
 * - Remaining inventory (scarcity pricing)
 * - Current demand (surge pricing)
 * - Special promotions and discounts
 */
class DynamicPricingService {
    /**
     * Calculate the current price for a ticket category
     * @param eventId Event ID
     * @param ticketCategoryId Ticket category ID
     * @param quantity Number of tickets
     */
    static async calculatePrice(eventId, ticketCategoryId, quantity) {
        try {
            // Get the base ticket price
            const ticketCategory = await prisma_1.default.ticketCategory.findUnique({
                where: { id: ticketCategoryId },
                include: { event: true }
            });
            if (!ticketCategory) {
                throw new apiError_1.ApiError(404, 'Ticket category not found', 'NOT_FOUND');
            }
            const basePrice = ticketCategory.price;
            let finalPrice = basePrice;
            const adjustments = [];
            // Get active pricing rules for this event
            const activePricingRules = await prisma_1.default.pricingRule.findMany({
                where: {
                    OR: [
                        { eventId },
                        { eventId: null, isGlobal: true } // Global rules that apply to all events
                    ],
                    isActive: true
                },
                orderBy: { priority: 'desc' } // Higher priority rules are applied first
            });
            // Process time-based rules (early bird, last minute)
            const now = new Date();
            const eventDate = new Date(ticketCategory.event.startDate);
            const daysUntilEvent = Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            // Apply each applicable rule
            for (const rule of activePricingRules) {
                let isApplicable = false;
                switch (rule.type) {
                    case 'TIME_BASED':
                        // Example: If rule says "30 days before event, 15% off"
                        isApplicable = daysUntilEvent <= rule.conditions.daysBeforeEvent;
                        break;
                    case 'INVENTORY_BASED':
                        // Example: If less than 20% of tickets remain, increase price
                        const soldTickets = await prisma_1.default.ticketSale.count({
                            where: { ticketCategoryId }
                        });
                        const remainingPercentage = (ticketCategory.capacity - soldTickets) / ticketCategory.capacity * 100;
                        isApplicable = remainingPercentage <= rule.conditions.remainingPercentageThreshold;
                        break;
                    case 'DEMAND_BASED':
                        // Example: If more than 10 purchases in the last hour, increase price
                        const recentSalesTimeWindow = new Date();
                        recentSalesTimeWindow.setHours(recentSalesTimeWindow.getHours() - rule.conditions.timeWindowHours);
                        const recentSales = await prisma_1.default.ticketSale.count({
                            where: {
                                ticketCategoryId,
                                createdAt: { gte: recentSalesTimeWindow }
                            }
                        });
                        isApplicable = recentSales >= rule.conditions.salesThreshold;
                        break;
                    case 'CUSTOM':
                        // Custom rules can have special logic
                        if (rule.conditions.specificDates && rule.conditions.specificDates.includes(now.toISOString().split('T')[0])) {
                            isApplicable = true;
                        }
                        break;
                }
                // Apply the rule if applicable
                if (isApplicable) {
                    const adjustment = {
                        ruleId: rule.id,
                        ruleName: rule.name,
                        type: rule.adjustmentType,
                        value: rule.adjustmentValue
                    };
                    if (rule.adjustmentType === 'PERCENTAGE') {
                        const amount = finalPrice * (rule.adjustmentValue / 100);
                        finalPrice += amount; // This could be negative for discounts
                        adjustment.amount = amount;
                    }
                    else {
                        finalPrice += rule.adjustmentValue; // This could be negative for discounts
                        adjustment.amount = rule.adjustmentValue;
                    }
                    adjustments.push(adjustment);
                }
            }
            // Ensure price doesn't go below minimum (if specified)
            if (ticketCategory.minimumPrice && finalPrice < ticketCategory.minimumPrice) {
                finalPrice = ticketCategory.minimumPrice;
            }
            // Calculate total discount
            const discount = basePrice - finalPrice;
            const discountPercentage = (discount / basePrice) * 100;
            // Calculate total for all tickets
            const perTicketPrice = finalPrice;
            const totalPrice = perTicketPrice * quantity;
            // Log this pricing calculation for analytics
            await this.logPricingCalculation(eventId, ticketCategoryId, basePrice, finalPrice, adjustments, quantity);
            return {
                basePrice,
                finalPrice,
                discount,
                discountPercentage,
                adjustments,
                perTicketPrice,
                totalPrice
            };
        }
        catch (error) {
            console.error('Error calculating dynamic price:', error);
            throw error instanceof apiError_1.ApiError ? error : new apiError_1.ApiError(500, 'Error calculating price', 'PRICING_ERROR');
        }
    }
    /**
     * Update or create a pricing rule
     * @param rule Pricing rule data
     */
    static async savePricingRule(rule) {
        try {
            if (rule.id) {
                // Update existing rule
                return prisma_1.default.pricingRule.update({
                    where: { id: rule.id },
                    data: {
                        name: rule.name,
                        description: rule.description,
                        type: rule.type,
                        conditions: rule.conditions,
                        adjustmentType: rule.adjustmentType,
                        adjustmentValue: rule.adjustmentValue,
                        priority: rule.priority,
                        isActive: rule.isActive,
                        updatedAt: new Date()
                    }
                });
            }
            else {
                // Create new rule
                return prisma_1.default.pricingRule.create({
                    data: {
                        name: rule.name,
                        description: rule.description,
                        type: rule.type,
                        conditions: rule.conditions,
                        adjustmentType: rule.adjustmentType,
                        adjustmentValue: rule.adjustmentValue,
                        priority: rule.priority,
                        isActive: rule.isActive
                    }
                });
            }
        }
        catch (error) {
            console.error('Error saving pricing rule:', error);
            throw new apiError_1.ApiError(500, 'Error saving pricing rule', 'DATABASE_ERROR');
        }
    }
    /**
     * Delete a pricing rule
     * @param ruleId Rule ID
     */
    static async deletePricingRule(ruleId) {
        try {
            await prisma_1.default.pricingRule.delete({
                where: { id: ruleId }
            });
        }
        catch (error) {
            console.error('Error deleting pricing rule:', error);
            throw new apiError_1.ApiError(500, 'Error deleting pricing rule', 'DATABASE_ERROR');
        }
    }
    /**
     * Get all pricing rules for an event
     * @param eventId Event ID (optional, if not provided return global rules)
     */
    static async getPricingRules(eventId) {
        try {
            const where = {};
            if (eventId) {
                where.OR = [
                    { eventId },
                    { isGlobal: true }
                ];
            }
            else {
                where.isGlobal = true;
            }
            return prisma_1.default.pricingRule.findMany({
                where,
                orderBy: { priority: 'desc' }
            });
        }
        catch (error) {
            console.error('Error fetching pricing rules:', error);
            throw new apiError_1.ApiError(500, 'Error fetching pricing rules', 'DATABASE_ERROR');
        }
    }
    /**
     * Log pricing calculation for auditing and analytics
     */
    static async logPricingCalculation(eventId, ticketCategoryId, basePrice, finalPrice, adjustments, quantity) {
        try {
            await prisma_1.default.pricingLog.create({
                data: {
                    eventId,
                    ticketCategoryId,
                    basePrice,
                    finalPrice,
                    adjustments: JSON.stringify(adjustments),
                    quantity,
                    calculatedAt: new Date()
                }
            });
        }
        catch (error) {
            console.error('Error logging pricing calculation:', error);
            // Non-critical, just log the error
        }
    }
}
exports.DynamicPricingService = DynamicPricingService;
//# sourceMappingURL=dynamicPricing.service.js.map