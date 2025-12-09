"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dynamicPricing_service_1 = require("../services/dynamicPricing.service");
const apiError_1 = require("../utils/apiError");
const apiResponse_1 = require("../utils/apiResponse");
const catchAsync_1 = require("../utils/catchAsync");
const dynamicPricing_validator_1 = require("../validators/dynamicPricing.validator");
const calculatePrice = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { eventId, ticketCategoryId, quantity } = dynamicPricing_validator_1.calculatePriceSchema.parse(req.query);
    const calculatedPrice = await dynamicPricing_service_1.DynamicPricingService.calculatePrice(eventId, ticketCategoryId, quantity);
    return apiResponse_1.ApiResponse.success(res, 200, 'Price calculated successfully', calculatedPrice);
});
const createPricingRule = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const validatedData = dynamicPricing_validator_1.createPricingRuleSchema.parse(req.body);
    const rule = await dynamicPricing_service_1.DynamicPricingService.savePricingRule(validatedData);
    return apiResponse_1.ApiResponse.created(res, rule, 'Pricing rule created successfully');
});
const getPricingRules = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const eventId = req.query.eventId;
    const rules = await dynamicPricing_service_1.DynamicPricingService.getPricingRules(eventId);
    return apiResponse_1.ApiResponse.success(res, 200, 'Pricing rules fetched successfully', rules);
});
const getPricingRule = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const rules = await dynamicPricing_service_1.DynamicPricingService.getPricingRules(undefined);
    const foundRule = rules.find(r => r.id === req.params.ruleId);
    if (!foundRule) {
        throw apiError_1.ApiError.notFound('Pricing rule not found');
    }
    return apiResponse_1.ApiResponse.success(res, 200, 'Pricing rule fetched successfully', foundRule);
});
const updatePricingRule = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const validatedData = dynamicPricing_validator_1.updatePricingRuleSchema.parse(req.body);
    const rule = await dynamicPricing_service_1.DynamicPricingService.savePricingRule({
        id: req.params.ruleId,
        ...validatedData
    });
    return apiResponse_1.ApiResponse.success(res, 200, 'Pricing rule updated successfully', rule);
});
const deletePricingRule = (0, catchAsync_1.catchAsync)(async (req, res) => {
    await dynamicPricing_service_1.DynamicPricingService.deletePricingRule(req.params.ruleId);
    return apiResponse_1.ApiResponse.success(res, 204, 'Pricing rule deleted successfully');
});
exports.default = {
    calculatePrice,
    createPricingRule,
    getPricingRules,
    getPricingRule,
    updatePricingRule,
    deletePricingRule
};
//# sourceMappingURL=dynamicPricing.controller.js.map