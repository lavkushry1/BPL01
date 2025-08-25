"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiscountController = void 0;
const discount_service_1 = require("../services/discount.service");
const apiResponse_1 = require("../utils/apiResponse");
const asyncHandler_1 = require("../utils/asyncHandler");
const apiError_1 = require("../utils/apiError");
/**
 * Controller for handling discount operations
 */
class DiscountController {
    /**
     * Create a new discount
     * @route POST /api/discounts
     */
    static createDiscount = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        try {
            const discount = await discount_service_1.discountService.createDiscountCode(req.body);
            return apiResponse_1.ApiResponse.success(res, 201, 'Discount created successfully', discount);
        }
        catch (error) {
            throw new apiError_1.ApiError(400, error.message || 'Failed to create discount');
        }
    });
    /**
     * Get discount by ID
     * @route GET /api/discounts/:id
     */
    static getDiscountById = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        try {
            const { id } = req.params;
            // Since there's no direct method, we'll get all and filter
            const discounts = await discount_service_1.discountService.getAllActiveDiscounts();
            const discount = discounts.find((d) => d.id === id);
            if (!discount) {
                throw new apiError_1.ApiError(404, 'Discount not found');
            }
            return apiResponse_1.ApiResponse.success(res, 200, 'Discount fetched successfully', discount);
        }
        catch (error) {
            throw error instanceof apiError_1.ApiError ? error : new apiError_1.ApiError(500, 'Failed to get discount');
        }
    });
    /**
     * Get discount by code
     * @route GET /api/discounts/code/:code
     */
    static getDiscountByCode = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        try {
            const { code } = req.params;
            const result = await discount_service_1.discountService.validateDiscountCode(code);
            if (!result || !result.valid) {
                throw new apiError_1.ApiError(404, 'Discount not found or invalid');
            }
            return apiResponse_1.ApiResponse.success(res, 200, 'Discount fetched successfully', result.discount);
        }
        catch (error) {
            throw error instanceof apiError_1.ApiError ? error : new apiError_1.ApiError(500, 'Failed to get discount');
        }
    });
    /**
     * Get all discounts
     * @route GET /api/discounts
     */
    static getAllDiscounts = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search;
        try {
            const discounts = await discount_service_1.discountService.getAllActiveDiscounts();
            // Apply search if provided
            const filteredDiscounts = search
                ? discounts.filter((d) => d.code.toLowerCase().includes(search.toLowerCase()) ||
                    (d.description && d.description.toLowerCase().includes(search.toLowerCase())))
                : discounts;
            // Apply pagination
            const startIndex = (page - 1) * limit;
            const endIndex = page * limit;
            const paginatedDiscounts = filteredDiscounts.slice(startIndex, endIndex);
            return apiResponse_1.ApiResponse.success(res, 200, 'Discounts fetched successfully', {
                discounts: paginatedDiscounts,
                total: filteredDiscounts.length,
                page,
                limit,
                totalPages: Math.ceil(filteredDiscounts.length / limit)
            });
        }
        catch (error) {
            throw new apiError_1.ApiError(500, 'Failed to get discounts');
        }
    });
    /**
     * Update a discount
     * @route PUT /api/discounts/:id
     */
    static updateDiscount = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        try {
            const { id } = req.params;
            const discount = await discount_service_1.discountService.updateDiscountCode(id, req.body);
            return apiResponse_1.ApiResponse.success(res, 200, 'Discount updated successfully', discount);
        }
        catch (error) {
            throw new apiError_1.ApiError(400, error.message || 'Failed to update discount');
        }
    });
    /**
     * Delete a discount
     * @route DELETE /api/discounts/:id
     */
    static deleteDiscount = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        try {
            const { id } = req.params;
            await discount_service_1.discountService.deleteDiscountCode(id);
            return apiResponse_1.ApiResponse.success(res, 200, 'Discount deleted successfully', {});
        }
        catch (error) {
            throw new apiError_1.ApiError(400, error.message || 'Failed to delete discount');
        }
    });
    /**
     * Apply a discount code
     * @route POST /api/discounts/apply
     */
    static applyDiscount = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        try {
            const { code, amount } = req.body;
            if (!code || !amount) {
                throw new apiError_1.ApiError(400, 'Discount code and amount are required');
            }
            const parsedAmount = parseFloat(amount);
            if (isNaN(parsedAmount) || parsedAmount <= 0) {
                throw new apiError_1.ApiError(400, 'Amount must be a positive number');
            }
            const validation = await discount_service_1.discountService.validateDiscountCode(code);
            if (!validation || !validation.valid) {
                throw new apiError_1.ApiError(400, validation?.message || 'Invalid discount code');
            }
            // Apply the discount code by incrementing its usage
            await discount_service_1.discountService.applyDiscountCode(validation.discount.id);
            // Calculate the discounted amount
            const discountValue = validation.discount.value || 0;
            const finalAmount = Math.max(0, parsedAmount - discountValue);
            return apiResponse_1.ApiResponse.success(res, 200, 'Discount applied successfully', {
                originalAmount: parsedAmount,
                discountAmount: discountValue,
                finalAmount,
                discount: validation.discount
            });
        }
        catch (error) {
            throw error instanceof apiError_1.ApiError ? error : new apiError_1.ApiError(400, error.message || 'Failed to apply discount');
        }
    });
    /**
     * Validate a discount code without applying it
     * @route POST /api/discounts/validate
     */
    static validateDiscountCode = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        try {
            const { code, amount } = req.body;
            if (!code || !amount) {
                throw new apiError_1.ApiError(400, 'Discount code and amount are required');
            }
            const parsedAmount = parseFloat(amount);
            if (isNaN(parsedAmount) || parsedAmount <= 0) {
                throw new apiError_1.ApiError(400, 'Amount must be a positive number');
            }
            const validation = await discount_service_1.discountService.validateDiscountCode(code);
            // If validation failed, return the error message
            if (!validation || !validation.valid) {
                return apiResponse_1.ApiResponse.success(res, 200, 'Discount validation result', {
                    valid: false,
                    message: validation?.message || 'Invalid discount code'
                });
            }
            // Calculate the discounted amount
            const discountValue = validation.discount.value || 0;
            const finalAmount = Math.max(0, parsedAmount - discountValue);
            return apiResponse_1.ApiResponse.success(res, 200, 'Discount validated successfully', {
                valid: true,
                discount: validation.discount,
                originalAmount: parsedAmount,
                discountAmount: discountValue,
                finalAmount
            });
        }
        catch (error) {
            throw error instanceof apiError_1.ApiError ? error : new apiError_1.ApiError(400, error.message || 'Failed to validate discount');
        }
    });
    /**
     * Get auto-apply discount for a specific event
     * @route GET /api/discounts/auto-apply
     */
    static getAutoApplyDiscount = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        try {
            const { eventId } = req.query;
            if (!eventId) {
                throw new apiError_1.ApiError(400, 'Event ID is required');
            }
            const discount = await discount_service_1.discountService.getAutoApplyDiscountForEvent(eventId);
            if (!discount) {
                return apiResponse_1.ApiResponse.success(res, 200, 'No auto-apply discount found', {
                    discount: null
                });
            }
            return apiResponse_1.ApiResponse.success(res, 200, 'Auto-apply discount fetched successfully', {
                discount
            });
        }
        catch (error) {
            throw error instanceof apiError_1.ApiError ? error : new apiError_1.ApiError(400, error.message || 'Failed to get auto-apply discount');
        }
    });
}
exports.DiscountController = DiscountController;
//# sourceMappingURL=discount.controller.js.map