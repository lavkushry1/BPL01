"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DynamicPricingService = void 0;
const client_1 = require("@prisma/client");
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
            const basePrice = Number(ticketCategory.price);
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
                const conditions = rule.conditions;
                switch (rule.type) {
                    case 'TIME_BASED':
                        // Example: If rule says "30 days before event, 15% off"
                        if (conditions.daysBeforeEvent !== undefined) {
                            isApplicable = daysUntilEvent <= conditions.daysBeforeEvent;
                        }
                        break;
                    case 'INVENTORY_BASED':
                        // Example: If less than 20% of tickets remain, increase price
                        const soldTickets = await prisma_1.default.ticket.count({
                            where: { ticketCategoryId }
                        });
                        // Assuming capacity is available on ticketCategory, defaulting to 100 if null for safety
                        const capacity = ticketCategory.capacity || 100;
                        const remainingPercentage = (capacity - soldTickets) / capacity * 100;
                        if (conditions.remainingPercentageThreshold !== undefined) {
                            isApplicable = remainingPercentage <= conditions.remainingPercentageThreshold;
                        }
                        break;
                    case 'DEMAND_BASED':
                        // Example: If more than 10 purchases in the last hour, increase price
                        if (conditions.timeWindowHours !== undefined && conditions.salesThreshold !== undefined) {
                            const recentSalesTimeWindow = new Date();
                            recentSalesTimeWindow.setHours(recentSalesTimeWindow.getHours() - conditions.timeWindowHours);
                            const recentSales = await prisma_1.default.ticket.count({
                                where: {
                                    ticketCategoryId,
                                    createdAt: { gte: recentSalesTimeWindow }
                                }
                            });
                            isApplicable = recentSales >= conditions.salesThreshold;
                        }
                        break;
                    case 'CUSTOM':
                        // Custom rules can have special logic
                        if (conditions.specificDates && conditions.specificDates.includes(now.toISOString().split('T')[0])) {
                            isApplicable = true;
                        }
                        break;
                }
                // Apply the rule if applicable
                if (isApplicable) {
                    const ruleAdjustmentValue = Number(rule.adjustmentValue);
                    const adjustment = {
                        ruleId: rule.id,
                        ruleName: rule.name,
                        type: rule.adjustmentType,
                        value: ruleAdjustmentValue,
                        amount: 0
                    };
                    if (rule.adjustmentType === 'PERCENTAGE') {
                        const amount = finalPrice * (ruleAdjustmentValue / 100);
                        finalPrice += amount; // This could be negative for discounts
                        adjustment.amount = amount;
                    }
                    else {
                        finalPrice += ruleAdjustmentValue; // This could be negative for discounts
                        adjustment.amount = ruleAdjustmentValue;
                    }
                    adjustments.push(adjustment);
                }
            }
            // Ensure price doesn't go below 0 (minimumPrice not in schema, assuming 0 floor)
            if (finalPrice < 0) {
                finalPrice = 0;
            }
            // Calculate total discount
            const discount = basePrice - finalPrice;
            const discountPercentage = basePrice > 0 ? (discount / basePrice) * 100 : 0;
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
            const ruleData = {
                name: rule.name,
                description: rule.description,
                type: rule.type,
                conditions: rule.conditions,
                adjustmentType: rule.adjustmentType,
                adjustmentValue: new client_1.Prisma.Decimal(rule.adjustmentValue),
                priority: rule.priority,
                isActive: rule.isActive
            };
            if (rule.id) {
                // Update existing rule
                return prisma_1.default.pricingRule.update({
                    where: { id: rule.id },
                    data: {
                        ...ruleData,
                        updatedAt: new Date()
                    }
                });
            }
            else {
                // Create new rule
                return prisma_1.default.pricingRule.create({
                    data: ruleData
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
                    basePrice: new client_1.Prisma.Decimal(basePrice),
                    finalPrice: new client_1.Prisma.Decimal(finalPrice),
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