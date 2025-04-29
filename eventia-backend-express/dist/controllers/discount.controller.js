"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiscountController = void 0;
const discount_service_1 = require("../services/discount.service");
const apiResponse_1 = require("../utils/apiResponse");
const apiError_1 = require("../utils/apiError");
const db_1 = require("../db");
const logger_1 = require("../utils/logger");
class DiscountController {
    /**
     * Create a new discount
     * @route POST /api/v1/discounts
     */
    static async createDiscount(req, res, next) {
        try {
            const discount = await discount_service_1.DiscountService.createDiscount(req.body);
            apiResponse_1.ApiResponse.success(res, 201, 'Discount created successfully', discount);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Get discount by ID
     * @route GET /api/v1/discounts/:id
     */
    static async getDiscountById(req, res, next) {
        try {
            const { id } = req.params;
            const discount = await discount_service_1.DiscountService.getDiscountById(id);
            apiResponse_1.ApiResponse.success(res, discount, 'Discount fetched successfully');
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Get discount by code
     * @route GET /api/v1/discounts/code/:code
     */
    static async getDiscountByCode(req, res, next) {
        try {
            const { code } = req.params;
            const discount = await discount_service_1.DiscountService.getDiscountByCode(code);
            if (!discount) {
                apiResponse_1.ApiResponse.success(res, 404, 'Discount not found', {});
                return;
            }
            apiResponse_1.ApiResponse.success(res, discount, 'Discount fetched successfully');
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Get all discounts
     * @route GET /api/v1/discounts
     */
    static async getAllDiscounts(req, res, next) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const isActive = req.query.isActive === 'true' ? true :
                req.query.isActive === 'false' ? false : undefined;
            const eventId = req.query.eventId;
            const search = req.query.search;
            const result = await discount_service_1.DiscountService.getAllDiscounts({
                page,
                limit,
                isActive,
                eventId,
                search
            });
            apiResponse_1.ApiResponse.success(res, result, 'Discounts fetched successfully');
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Update discount
     * @route PUT /api/v1/discounts/:id
     */
    static async updateDiscount(req, res, next) {
        try {
            const { id } = req.params;
            const discount = await discount_service_1.DiscountService.updateDiscount(id, req.body);
            apiResponse_1.ApiResponse.success(res, discount, 'Discount updated successfully');
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Delete discount
     * @route DELETE /api/v1/discounts/:id
     */
    static async deleteDiscount(req, res, next) {
        try {
            const { id } = req.params;
            await discount_service_1.DiscountService.deleteDiscount(id);
            apiResponse_1.ApiResponse.success(res, {}, 'Discount deleted successfully');
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Validate and apply discount
     * @route POST /api/v1/discounts/apply
     */
    static async applyDiscount(req, res, next) {
        try {
            const { code, amount, eventId } = req.body;
            if (!code?.trim() || isNaN(Number(amount))) {
                throw new apiError_1.ApiError(400, 'Valid code and numeric amount required', 'VALIDATION_ERROR');
            }
            const parsedAmount = parseFloat(amount.toString());
            if (isNaN(parsedAmount)) {
                throw new apiError_1.ApiError(400, 'Invalid amount format', 'VALIDATION_ERROR');
            }
            const result = await discount_service_1.DiscountService.applyDiscount(code, parsedAmount, eventId);
            apiResponse_1.ApiResponse.success(res, result, 'Discount applied successfully');
        }
        catch (error) {
            // Special handling for validation errors from discount service
            if (error instanceof apiError_1.ApiError &&
                ['INVALID_DISCOUNT', 'INACTIVE_DISCOUNT', 'EXPIRED_DISCOUNT',
                    'DISCOUNT_LIMIT_REACHED', 'MINIMUM_AMOUNT_NOT_MET',
                    'DISCOUNT_EVENT_MISMATCH'].includes(error.code)) {
                // Return error response
                res.status(error.statusCode).json({
                    status: 'error',
                    statusCode: error.statusCode,
                    message: error.message,
                    code: error.code
                });
                return;
            }
            next(error);
        }
    }
    /**
     * Validate a discount code and calculate the applicable discount
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     * @returns {Promise<Response>} - Returns discount details if valid
     */
    static validateDiscount = async (req, res) => {
        try {
            const { code, booking_id, total_amount } = req.body;
            // Get the booking to verify it exists and get the event ID
            const booking = await (0, db_1.db)('bookings')
                .where('id', booking_id)
                .select('event_id')
                .first();
            if (!booking) {
                return res.status(404).json({
                    success: false,
                    message: 'Booking not found'
                });
            }
            // Get current date for validation
            const now = new Date();
            // Find the discount
            const discount = await (0, db_1.db)('discounts')
                .where('code', code)
                .where('is_active', true)
                .where('start_date', '<=', now)
                .where('end_date', '>=', now)
                .first();
            if (!discount) {
                return res.status(404).json({
                    success: false,
                    message: 'Invalid discount code'
                });
            }
            // Check if discount is applicable to this event
            const isEventDiscountValid = await (0, db_1.db)('event_discounts')
                .where({
                discount_id: discount.id,
                event_id: booking.event_id
            })
                .first();
            // If discount has event restrictions and this event isn't included
            if (discount.event_specific && !isEventDiscountValid) {
                return res.status(400).json({
                    success: false,
                    message: 'Discount code not applicable for this event'
                });
            }
            // Check if discount has been used max times
            if (discount.max_uses > 0 && discount.used_count >= discount.max_uses) {
                return res.status(400).json({
                    success: false,
                    message: 'Discount code has reached maximum usage limit'
                });
            }
            // Check minimum amount if specified
            if (discount.min_amount && total_amount < discount.min_amount) {
                return res.status(400).json({
                    success: false,
                    message: `Minimum order amount of ₹${discount.min_amount} required for this discount`
                });
            }
            // Calculate discount amount
            let discountAmount = 0;
            if (discount.type === 'PERCENTAGE') {
                discountAmount = (total_amount * discount.value) / 100;
            }
            else if (discount.type === 'FIXED') {
                discountAmount = discount.value;
            }
            // Make sure discount doesn't exceed total amount
            discountAmount = Math.min(discountAmount, total_amount);
            // Calculate final amount
            const finalAmount = total_amount - discountAmount;
            return res.status(200).json({
                success: true,
                data: {
                    discount_id: discount.id,
                    code: discount.code,
                    description: discount.description,
                    discount_amount: discountAmount,
                    original_amount: total_amount,
                    final_amount: finalAmount,
                    discount_type: discount.type,
                    discount_value: discount.value
                }
            });
        }
        catch (error) {
            logger_1.logger.error('Error validating discount:', error);
            return res.status(500).json({
                success: false,
                message: 'Error validating discount code'
            });
        }
    };
}
exports.DiscountController = DiscountController;
