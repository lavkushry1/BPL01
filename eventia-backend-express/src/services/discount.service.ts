import { Discount } from '../models/discount.model';
import { db } from '../db';
import { ApiError } from '../utils/apiError';

export const discountService = {
  /**
   * Get all active discounts
   */
  async getAllActiveDiscounts() {
    try {
      const discounts = await db('discounts')
        .select('*')
        .where({ is_active: true })
        .orderBy('created_at', 'desc');
      
      return discounts;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Validate a discount code
   */
  async validateDiscountCode(code: string) {
    try {
      // Find the discount with the given code
      const discount = await db('discounts')
        .select('*')
        .whereRaw('UPPER(code) = ?', [code.toUpperCase()])
        .where({ is_active: true })
        .first();
      
      if (!discount) {
        return { 
          valid: false, 
          message: 'Invalid discount code' 
        };
      }
      
      // Check if discount has expired
      const now = new Date();
      if (discount.expiry_date && new Date(discount.expiry_date) < now) {
        return {
          valid: false,
          message: 'This discount code has expired'
        };
      }
      
      // Check if the discount has reached its maximum usage
      if (discount.max_uses > 0 && discount.uses_count >= discount.max_uses) {
        return {
          valid: false,
          message: 'This discount code has reached its maximum usage limit'
        };
      }
      
      return { 
        valid: true, 
        discount
      };
    } catch (error) {
      return null;
    }
  },

  /**
   * Apply a discount code (increment uses_count)
   */
  async applyDiscountCode(id: string) {
    try {
      // Get the current discount
      const discount = await db('discounts')
        .select('*')
        .where({ id })
        .first();
      
      if (!discount) {
        throw new ApiError(404, 'Discount not found');
      }
      
      // Increment uses count
      const [updatedDiscount] = await db('discounts')
        .where({ id })
        .update({
          uses_count: db.raw('uses_count + 1'),
          updated_at: new Date()
        })
        .returning('*');
      
      return updatedDiscount;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Check if an auto-apply discount already exists for an event
   */
  async checkExistingAutoApplyDiscount(eventId: string, currentDiscountId?: string) {
    try {
      const query = db('discounts')
        .where({
          auto_apply: true,
          is_active: true,
          event_id: eventId
        });
      
      if (currentDiscountId) {
        query.whereNot({ id: currentDiscountId });
      }
      
      const existingDiscount = await query.first();
      return !!existingDiscount;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Create a new discount code
   */
  async createDiscountCode(discount: Omit<Discount, 'id' | 'created_at' | 'uses_count'>) {
    try {
      // If this is an auto-apply discount, check if one already exists for this event
      if (discount.auto_apply && discount.event_id) {
        const hasExisting = await this.checkExistingAutoApplyDiscount(discount.event_id);
        if (hasExisting) {
          throw new ApiError(400, 'An auto-apply discount already exists for this event. Only one auto-apply discount per event is allowed.');
        }
      }
      
      // Create the discount
      const [createdDiscount] = await db('discounts')
        .insert({
          code: discount.code.toUpperCase(),
          amount: discount.amount,
          description: discount.description,
          max_uses: discount.max_uses,
          uses_count: 0,
          expiry_date: discount.expiry_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Default to 30 days
          is_active: discount.is_active !== undefined ? discount.is_active : true,
          auto_apply: discount.auto_apply || false,
          event_id: discount.event_id || null,
          priority: discount.priority || 0,
          created_at: new Date(),
          updated_at: new Date()
        })
        .returning('*');
      
      return createdDiscount;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Update an existing discount code
   */
  async updateDiscountCode(id: string, discount: Partial<Discount>) {
    try {
      // If this is an auto-apply discount, check if one already exists for this event
      if (discount.auto_apply && discount.event_id) {
        const hasExisting = await this.checkExistingAutoApplyDiscount(discount.event_id, id);
        if (hasExisting) {
          throw new ApiError(400, 'An auto-apply discount already exists for this event. Only one auto-apply discount per event is allowed.');
        }
      }
      
      // Update fields that are provided
      const updateData: Record<string, any> = { updated_at: new Date() };
      
      if (discount.code !== undefined) updateData.code = discount.code.toUpperCase();
      if (discount.amount !== undefined) updateData.amount = discount.amount;
      if (discount.max_uses !== undefined) updateData.max_uses = discount.max_uses;
      if (discount.description !== undefined) updateData.description = discount.description;
      if (discount.expiry_date !== undefined) updateData.expiry_date = discount.expiry_date;
      if (discount.is_active !== undefined) updateData.is_active = discount.is_active;
      if (discount.auto_apply !== undefined) updateData.auto_apply = discount.auto_apply;
      if (discount.event_id !== undefined) updateData.event_id = discount.event_id;
      if (discount.priority !== undefined) updateData.priority = discount.priority;
      
      const [updatedDiscount] = await db('discounts')
        .where({ id })
        .update(updateData)
        .returning('*');
        
      if (!updatedDiscount) {
        throw new ApiError(404, 'Discount not found');
      }
      
      return updatedDiscount;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Delete a discount code
   */
  async deleteDiscountCode(id: string) {
    try {
      const deleted = await db('discounts')
        .where({ id })
        .delete();
        
      if (!deleted) {
        throw new ApiError(404, 'Discount not found');
      }
      
      return true;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get auto-apply discount for a specific event
   */
  async getAutoApplyDiscountForEvent(eventId: string) {
    try {
      // Find auto-apply discount for this event
      const discount = await db('discounts')
        .select('*')
        .where({
          event_id: eventId,
          auto_apply: true,
          is_active: true
        })
        .first();
      
      if (!discount) {
        return null;
      }
      
      // Check if discount has expired
      const now = new Date();
      if (discount.expiry_date && new Date(discount.expiry_date) < now) {
        return null;
      }
      
      // Check if the discount has reached its maximum usage
      if (discount.max_uses > 0 && discount.uses_count >= discount.max_uses) {
        return null;
      }
      
      return discount;
    } catch (error) {
      return null;
    }
  },

  /**
   * Validate an auto-apply discount
   */
  async validateAutoApplyDiscount(discountId: string) {
    try {
      const discount = await db('discounts')
        .select('*')
        .where({ id: discountId })
        .first();
      
      if (!discount || !discount.is_active || !discount.auto_apply) {
        return null;
      }
      
      // Check if discount has expired
      const now = new Date();
      if (discount.expiry_date && new Date(discount.expiry_date) < now) {
        return null;
      }
      
      // Check if the discount has reached its maximum usage
      if (discount.max_uses > 0 && discount.uses_count >= discount.max_uses) {
        return null;
      }
      
      return discount;
    } catch (error) {
      return null;
    }
  }
};
