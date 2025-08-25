"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const catchAsync_1 = require("../utils/catchAsync");
const apiError_1 = require("../utils/apiError");
const dynamicPricing_service_1 = require("../services/dynamicPricing.service");
// Define HTTP status codes instead of using external package
const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    NOT_FOUND: 404
};
const calculatePrice = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { eventId, ticketCategoryId, quantity } = req.query;
    if (!eventId || !ticketCategoryId) {
        throw apiError_1.ApiError.badRequest('eventId and ticketCategoryId are required');
    }
    const calculatedPrice = await dynamicPricing_service_1.DynamicPricingService.calculatePrice(eventId, ticketCategoryId, quantity ? Number(quantity) : 1);
    res.status(HTTP_STATUS.OK).json(calculatedPrice);
});
const createPricingRule = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const rule = await dynamicPricing_service_1.DynamicPricingService.savePricingRule(req.body);
    res.status(HTTP_STATUS.CREATED).json(rule);
});
const getPricingRules = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const eventId = req.query.eventId;
    const rules = await dynamicPricing_service_1.DynamicPricingService.getPricingRules(eventId);
    res.status(HTTP_STATUS.OK).json(rules);
});
const getPricingRule = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const rules = await dynamicPricing_service_1.DynamicPricingService.getPricingRules(undefined);
    const foundRule = rules.find(r => r.id === req.params.ruleId);
    if (!foundRule) {
        throw apiError_1.ApiError.notFound('Pricing rule not found');
    }
    res.status(HTTP_STATUS.OK).json(foundRule);
});
const updatePricingRule = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const rule = await dynamicPricing_service_1.DynamicPricingService.savePricingRule({
        id: req.params.ruleId,
        ...req.body
    });
    res.status(HTTP_STATUS.OK).json(rule);
});
const deletePricingRule = (0, catchAsync_1.catchAsync)(async (req, res) => {
    await dynamicPricing_service_1.DynamicPricingService.deletePricingRule(req.params.ruleId);
    res.status(HTTP_STATUS.NO_CONTENT).send();
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