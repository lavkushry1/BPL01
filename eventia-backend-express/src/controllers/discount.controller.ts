import { Request, Response } from 'express';
import { discountService } from '../services/discount.service';
import { ApiError } from '../utils/apiError';
import { ApiResponse } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';

/**
 * Controller for handling discount operations
 */
export class DiscountController {
  /**
   * Create a new discount
   * @route POST /api/discounts
   */
  static createDiscount = asyncHandler(async (req: Request, res: Response) => {
    try {
      const discount = await discountService.createDiscountCode(req.body);
      return ApiResponse.success(res, 201, 'Discount created successfully', discount);
    } catch (error: any) {
      throw new ApiError(400, error.message || 'Failed to create discount');
    }
  });

  /**
   * Get discount by ID
   * @route GET /api/discounts/:id
   */
  static getDiscountById = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      // Since there's no direct method, we'll get all and filter
      const discounts = await discountService.getAllActiveDiscounts();
      const discount = discounts.find((d: any) => d.id === id);

      if (!discount) {
        throw new ApiError(404, 'Discount not found');
      }

      return ApiResponse.success(res, 200, 'Discount fetched successfully', discount);
    } catch (error) {
      throw error instanceof ApiError ? error : new ApiError(500, 'Failed to get discount');
    }
  });

  /**
   * Get discount by code
   * @route GET /api/discounts/code/:code
   */
  static getDiscountByCode = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { code } = req.params;
      const result = await discountService.validateDiscountCode(code);

      if (!result || !result.valid) {
        throw new ApiError(404, 'Discount not found or invalid');
      }

      return ApiResponse.success(res, 200, 'Discount fetched successfully', result.discount);
    } catch (error) {
      throw error instanceof ApiError ? error : new ApiError(500, 'Failed to get discount');
    }
  });

  /**
   * Get all discounts
   * @route GET /api/discounts
   */
  static getAllDiscounts = asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;

    try {
      const discounts = await discountService.getAllActiveDiscounts();

      // Apply search if provided
      const filteredDiscounts = search
        ? discounts.filter((d: any) =>
            d.code.toLowerCase().includes(search.toLowerCase()) ||
            (d.description && d.description.toLowerCase().includes(search.toLowerCase()))
          )
        : discounts;

      // Apply pagination
      const startIndex = (page - 1) * limit;
      const endIndex = page * limit;
      const paginatedDiscounts = filteredDiscounts.slice(startIndex, endIndex);

      return ApiResponse.success(res, 200, 'Discounts fetched successfully', {
        discounts: paginatedDiscounts,
        total: filteredDiscounts.length,
        page,
        limit,
        totalPages: Math.ceil(filteredDiscounts.length / limit)
      });
    } catch (error) {
      throw new ApiError(500, 'Failed to get discounts');
    }
  });

  /**
   * Update a discount
   * @route PUT /api/discounts/:id
   */
  static updateDiscount = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const discount = await discountService.updateDiscountCode(id, req.body);
      return ApiResponse.success(res, 200, 'Discount updated successfully', discount);
    } catch (error: any) {
      throw new ApiError(400, error.message || 'Failed to update discount');
    }
  });

  /**
   * Delete a discount
   * @route DELETE /api/discounts/:id
   */
  static deleteDiscount = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await discountService.deleteDiscountCode(id);
      return ApiResponse.success(res, 200, 'Discount deleted successfully', {});
    } catch (error: any) {
      throw new ApiError(400, error.message || 'Failed to delete discount');
    }
  });

  /**
   * Apply a discount code
   * @route POST /api/discounts/apply
   */
  static applyDiscount = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { code, amount } = req.body;

      const parsedAmount = parseFloat(amount);

      const validation = await discountService.validateDiscountCode(code);
      if (!validation || !validation.valid) {
        throw new ApiError(400, validation?.message || 'Invalid discount code');
      }

      // Apply the discount code by incrementing its usage
      await discountService.applyDiscountCode(validation.discount.id);

      // Calculate the discounted amount
      const discountValue = validation.discount.value || 0;
      const finalAmount = Math.max(0, parsedAmount - discountValue);

      return ApiResponse.success(res, 200, 'Discount applied successfully', {
        originalAmount: parsedAmount,
        discountAmount: discountValue,
        finalAmount,
        discount: validation.discount
      });
    } catch (error: any) {
      throw error instanceof ApiError ? error : new ApiError(400, error.message || 'Failed to apply discount');
    }
  });

  /**
   * Validate a discount code without applying it
   * @route POST /api/discounts/validate
   */
  static validateDiscountCode = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { code, amount } = req.body;

      const parsedAmount = parseFloat(amount);

      const validation = await discountService.validateDiscountCode(code);

      // If validation failed, return the error message
      if (!validation || !validation.valid) {
        return ApiResponse.success(res, 200, 'Discount validation result', {
          valid: false,
          message: validation?.message || 'Invalid discount code'
        });
      }

      // Calculate the discounted amount
      const discountValue = validation.discount.value || 0;
      const finalAmount = Math.max(0, parsedAmount - discountValue);

      return ApiResponse.success(res, 200, 'Discount validated successfully', {
        valid: true,
        discount: validation.discount,
        originalAmount: parsedAmount,
        discountAmount: discountValue,
        finalAmount
      });
    } catch (error: any) {
      throw error instanceof ApiError ? error : new ApiError(400, error.message || 'Failed to validate discount');
    }
  });

  /**
   * Get auto-apply discount for a specific event
   * @route GET /api/discounts/auto-apply
   */
  static getAutoApplyDiscount = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { eventId } = req.query;

      const discount = await discountService.getAutoApplyDiscountForEvent(eventId as string);

      if (!discount) {
        return ApiResponse.success(res, 200, 'No auto-apply discount found', {
          discount: null
        });
      }

      return ApiResponse.success(res, 200, 'Auto-apply discount fetched successfully', {
        discount
      });
    } catch (error: any) {
      throw error instanceof ApiError ? error : new ApiError(400, error.message || 'Failed to get auto-apply discount');
    }
  });
}
