/**
 * @service DiscountApiService
 * @description Service for handling discount-related API calls to the Express backend.
 */
import { defaultApiClient } from './apiUtils';
import { unwrapApiResponse } from './responseUtils';

export interface Discount {
  id: string;
  code: string;
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
  description?: string;
  min_amount?: number;
  max_uses?: number;
  used_count?: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  event_specific?: boolean;
}

export interface DiscountValidationResponse {
  valid: boolean;
  discount?: Discount;
  finalAmount?: number;
  message?: string;
  discountAmount?: number;
}

/**
 * Get all discounts (admin only)
 */
export const getAllDiscounts = async (): Promise<Discount[]> => {
  try {
    const response = await defaultApiClient.get('/admin/discounts');
    return unwrapApiResponse<Discount[]>(response);
  } catch (error: any) {
    console.error('Error fetching all discounts:', error);
    throw error;
  }
};

/**
 * Create a new discount (admin only)
 */
export interface CreateDiscountData {
  code: string;
  type: 'FIXED' | 'PERCENTAGE';
  value: number;
  minAmount?: number;
  maxUses?: number;
  startDate: string;
  endDate: string;
  description?: string;
}

export const createDiscount = async (data: CreateDiscountData): Promise<Discount> => {
  try {
    const response = await defaultApiClient.post('/admin/discounts', data);
    return unwrapApiResponse<Discount>(response);
  } catch (error: any) {
    console.error('Error creating discount:', error);
    throw error;
  }
};

/**
 * Delete a discount (admin only)
 */
export const deleteDiscount = async (id: string): Promise<void> => {
  try {
    await defaultApiClient.delete(`/admin/discounts/${id}`);
  } catch (error: any) {
    console.error(`Error deleting discount ${id}:`, error);
    throw error;
  }
};

/**
 * Validate a discount code
 */
export const validateDiscountCode = async (
  code: string,
  amount: number,
  eventId?: string
): Promise<DiscountValidationResponse> => {
  try {
    const params: any = {
      code,
      amount
    };

    if (eventId) {
      params.eventId = eventId;
    }

    const response = await defaultApiClient.post('/discounts/validate', params);
    return unwrapApiResponse<DiscountValidationResponse>(response);
  } catch (error: any) {
    // Handle specific API errors
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    console.error('Error validating discount code:', error);
    throw error;
  }
};

/**
 * Apply a discount code to a booking
 */
export const applyDiscount = async (
  code: string,
  bookingId: string,
  totalAmount: number
): Promise<{
  success: boolean;
  message: string;
  discountAmount?: number;
  finalAmount?: number;
}> => {
  try {
    const response = await defaultApiClient.post('/discounts/apply', {
      code,
      booking_id: bookingId,
      total_amount: totalAmount
    });
    return response.data;
  } catch (error: any) {
    // Handle specific API errors
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    console.error('Error applying discount code:', error);
    throw error;
  }
};

/**
 * Get auto-apply discount for an event
 */
export const getAutoApplyDiscount = async (
  eventId: string
): Promise<Discount | null> => {
  try {
    const response = await defaultApiClient.get(`/discounts/auto-apply?eventId=${eventId}`);
    return response.data.data.discount;
  } catch (error) {
    console.error('Error fetching auto-apply discount:', error);
    return null;
  }
};

export default {
  validateDiscountCode,
  applyDiscount,
  getAutoApplyDiscount,
  getAllDiscounts,
  createDiscount,
  deleteDiscount
}; 
