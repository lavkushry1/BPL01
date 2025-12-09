import { ApiError } from '../utils/apiError';
import { logger } from '../utils/logger';
import { prisma } from '../db/prisma';

interface PricingRule {
  id: string;
  name: string;
  type: 'TIME_BASED' | 'INVENTORY_BASED' | 'DEMAND_BASED' | 'CUSTOM';
  conditions: any;
  adjustmentType: 'PERCENTAGE' | 'FIXED';
  adjustmentValue: number;
  priority: number;
  isActive: boolean;
}

interface PriceCalculationResult {
  basePrice: number;
  finalPrice: number;
  adjustments: {
    ruleId: string;
    ruleName: string;
    adjustmentType: string;
    adjustmentValue: number;
    appliedAmount: number;
  }[];
  discountPercentage?: number;
  calculationTime: Date;
}

export default class DynamicPricingService {
  /**
   * Calculate the dynamic price for tickets based on various factors
   */
  async calculatePrice(
    eventId: string,
    ticketCategoryId: string,
    quantity: number = 1,
    options: {
      applyMinimumPrice?: boolean;
      minimumPricePercentage?: number;
      logCalculation?: boolean;
    } = {}
  ): Promise<PriceCalculationResult> {
    try {
      // Set default options
      const { 
        applyMinimumPrice = true, 
        minimumPricePercentage = 70, 
        logCalculation = true 
      } = options;

      // Get ticket category to determine base price
      const ticketCategory = await prisma.ticketCategory.findUnique({
        where: { id: ticketCategoryId },
        include: { event: true }
      });

      if (!ticketCategory) {
        throw new ApiError(404, 'Ticket category not found');
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
        if (!rule.isActive) continue;
        
        const shouldApply = await this.evaluateRuleConditions(rule, {
          eventId,
          ticketCategoryId,
          quantity,
          basePrice,
          currentPrice: finalPrice
        });
        
        if (!shouldApply) continue;
        
        // Calculate adjustment
        let adjustmentAmount = 0;
        
        if (rule.adjustmentType === 'PERCENTAGE') {
          adjustmentAmount = (finalPrice * (rule.adjustmentValue / 100));
        } else { // FIXED
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
      
      const result: PriceCalculationResult = {
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
    } catch (error) {
      logger.error('Dynamic pricing calculation error:', error);
      throw error instanceof ApiError 
        ? error 
        : new ApiError(500, 'Failed to calculate dynamic pricing');
    }
  }
  
  /**
   * Evaluate if a rule should be applied based on its conditions
   */
  private async evaluateRuleConditions(
    rule: PricingRule, 
    context: {
      eventId: string;
      ticketCategoryId: string;
      quantity: number;
      basePrice: number;
      currentPrice: number;
    }
  ): Promise<boolean> {
    try {
      const { type, conditions } = rule;
      const { eventId, ticketCategoryId } = context;
      
      switch (type) {
        case 'TIME_BASED': {
          // Check if current time is within the specified time range
          const event = await prisma.event.findUnique({ where: { id: eventId } });
          if (!event) return false;
          
          const currentTime = new Date();
          const eventTime = new Date(event.startDate);
          
          // Get days until event
          const daysUntilEvent = Math.ceil((eventTime.getTime() - currentTime.getTime()) / (1000 * 60 * 60 * 24));
          
          if (conditions.minDays && daysUntilEvent < conditions.minDays) return false;
          if (conditions.maxDays && daysUntilEvent > conditions.maxDays) return false;
          
          return true;
        }
        
        case 'INVENTORY_BASED': {
          // Check if current inventory levels meet the conditions
          const ticketCategory = await prisma.ticketCategory.findUnique({
            where: { id: ticketCategoryId },
            select: { totalSeats: true, bookedSeats: true }
          });
          
          if (!ticketCategory) return false;
          
          const availablePercentage = 
            ((ticketCategory.totalSeats - ticketCategory.bookedSeats) / ticketCategory.totalSeats) * 100;
          
          if (conditions.minAvailablePercentage && availablePercentage < conditions.minAvailablePercentage) return false;
          if (conditions.maxAvailablePercentage && availablePercentage > conditions.maxAvailablePercentage) return false;
          
          return true;
        }
        
        case 'DEMAND_BASED': {
          // Check if current demand meets the conditions
          // Demand could be measured by recent bookings
          const recentBookingCount = await prisma.booking.count({
            where: {
              ticketCategoryId,
              createdAt: {
                gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
              }
            }
          });
          
          if (conditions.minRecentBookings && recentBookingCount < conditions.minRecentBookings) return false;
          if (conditions.maxRecentBookings && recentBookingCount > conditions.maxRecentBookings) return false;
          
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
            if (conditions.startDate && new Date(conditions.startDate) > currentDate) return false;
            if (conditions.endDate && new Date(conditions.endDate) < currentDate) return false;
            return true;
          }
          
          return false;
        }
        
        default:
          return false;
      }
    } catch (error) {
      logger.error(`Error evaluating pricing rule ${rule.id}:`, error);
      return false;
    }
  }
  
  /**
   * Get all applicable pricing rules for an event
   */
  private async getApplicablePricingRules(eventId: string): Promise<PricingRule[]> {
    try {
      // Get both event-specific rules and global rules
      return await prisma.pricingRule.findMany({
        where: {
          isActive: true,
          OR: [
            { eventId },
            { isGlobal: true }
          ]
        },
        orderBy: { priority: 'desc' }
      });
    } catch (error) {
      logger.error('Error fetching pricing rules:', error);
      throw new ApiError(500, 'Failed to fetch pricing rules');
    }
  }
  
  /**
   * Log the price calculation for analytics
   */
  private async logPriceCalculation(
    eventId: string,
    ticketCategoryId: string,
    result: PriceCalculationResult,
    quantity: number
  ): Promise<void> {
    try {
      await prisma.pricingLog.create({
        data: {
          eventId,
          ticketCategoryId,
          basePrice: result.basePrice,
          finalPrice: result.finalPrice,
          adjustments: JSON.stringify(result.adjustments),
          quantity,
        }
      });
    } catch (error) {
      // Just log the error but don't fail the price calculation
      logger.error('Failed to log price calculation:', error);
    }
  }

  /**
   * Save a new pricing rule
   */
  async savePricingRule(data: Omit<PricingRule, 'id'>): Promise<PricingRule> {
    try {
      return await prisma.pricingRule.create({
        data: {
          ...data,
          conditions: data.conditions || {}
        }
      });
    } catch (error) {
      logger.error('Error creating pricing rule:', error);
      throw new ApiError(500, 'Failed to create pricing rule');
    }
  }

  /**
   * Update an existing pricing rule
   */
  async updatePricingRule(id: string, data: Partial<Omit<PricingRule, 'id'>>): Promise<PricingRule> {
    try {
      return await prisma.pricingRule.update({
        where: { id },
        data
      });
    } catch (error) {
      logger.error(`Error updating pricing rule ${id}:`, error);
      throw new ApiError(500, 'Failed to update pricing rule');
    }
  }

  /**
   * Delete a pricing rule
   */
  async deletePricingRule(id: string): Promise<void> {
    try {
      await prisma.pricingRule.delete({
        where: { id }
      });
    } catch (error) {
      logger.error(`Error deleting pricing rule ${id}:`, error);
      throw new ApiError(500, 'Failed to delete pricing rule');
    }
  }

  /**
   * Get all pricing rules
   */
  async getPricingRules(filters: { eventId?: string; isActive?: boolean } = {}): Promise<PricingRule[]> {
    try {
      return await prisma.pricingRule.findMany({
        where: {
          ...filters
        },
        orderBy: { priority: 'desc' }
      });
    } catch (error) {
      logger.error('Error fetching pricing rules:', error);
      throw new ApiError(500, 'Failed to fetch pricing rules');
    }
  }

  /**
   * Get a pricing rule by ID
   */
  async getPricingRuleById(id: string): Promise<PricingRule | null> {
    try {
      return await prisma.pricingRule.findUnique({
        where: { id }
      });
    } catch (error) {
      logger.error(`Error fetching pricing rule ${id}:`, error);
      throw new ApiError(500, 'Failed to fetch pricing rule');
    }
  }
} 
