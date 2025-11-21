import { Request, Response } from 'express';
import { DynamicPricingService } from '../services/dynamicPricing.service';
import { ApiError } from '../utils/apiError';
import { ApiResponse } from '../utils/apiResponse';
import { catchAsync } from '../utils/catchAsync';

const calculatePrice = catchAsync(async (req: Request, res: Response) => {
  const { eventId, ticketCategoryId, quantity } = req.query;

  if (!eventId || !ticketCategoryId) {
    throw ApiError.badRequest('eventId and ticketCategoryId are required');
  }

  const calculatedPrice = await DynamicPricingService.calculatePrice(
    eventId as string,
    ticketCategoryId as string,
    quantity ? Number(quantity) : 1
  );

  return ApiResponse.success(res, 200, 'Price calculated successfully', calculatedPrice);
});

const createPricingRule = catchAsync(async (req: Request, res: Response) => {
  const rule = await DynamicPricingService.savePricingRule(req.body);
  return ApiResponse.created(res, rule, 'Pricing rule created successfully');
});

const getPricingRules = catchAsync(async (req: Request, res: Response) => {
  const eventId = req.query.eventId as string | undefined;

  const rules = await DynamicPricingService.getPricingRules(eventId);
  return ApiResponse.success(res, 200, 'Pricing rules fetched successfully', rules);
});

const getPricingRule = catchAsync(async (req: Request, res: Response) => {
  const rules = await DynamicPricingService.getPricingRules(undefined);
  const foundRule = rules.find(r => r.id === req.params.ruleId);

  if (!foundRule) {
    throw ApiError.notFound('Pricing rule not found');
  }
  return ApiResponse.success(res, 200, 'Pricing rule fetched successfully', foundRule);
});

const updatePricingRule = catchAsync(async (req: Request, res: Response) => {
  const rule = await DynamicPricingService.savePricingRule({
    id: req.params.ruleId,
    ...req.body
  });
  return ApiResponse.success(res, 200, 'Pricing rule updated successfully', rule);
});

const deletePricingRule = catchAsync(async (req: Request, res: Response) => {
  await DynamicPricingService.deletePricingRule(req.params.ruleId);
  return ApiResponse.success(res, 204, 'Pricing rule deleted successfully');
});

export default {
  calculatePrice,
  createPricingRule,
  getPricingRules,
  getPricingRule,
  updatePricingRule,
  deletePricingRule
};
