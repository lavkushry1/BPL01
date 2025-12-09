import { Request, Response } from 'express';
import { DynamicPricingService } from '../services/dynamicPricing.service';
import { ApiError } from '../utils/apiError';
import { ApiResponse } from '../utils/apiResponse';
import { catchAsync } from '../utils/catchAsync';
import { calculatePriceSchema, createPricingRuleSchema, updatePricingRuleSchema } from '../validators/dynamicPricing.validator';

const calculatePrice = catchAsync(async (req: Request, res: Response) => {
  const { eventId, ticketCategoryId, quantity } = calculatePriceSchema.parse(req.query);

  const calculatedPrice = await DynamicPricingService.calculatePrice(
    eventId,
    ticketCategoryId,
    quantity
  );

  return ApiResponse.success(res, 200, 'Price calculated successfully', calculatedPrice);
});

const createPricingRule = catchAsync(async (req: Request, res: Response) => {
  const validatedData = createPricingRuleSchema.parse(req.body);
  const rule = await DynamicPricingService.savePricingRule(validatedData as any);
  return ApiResponse.success(res, 201, 'Pricing rule created successfully', rule);
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
  const validatedData = updatePricingRuleSchema.parse(req.body);
  const rule = await DynamicPricingService.savePricingRule({
    id: req.params.ruleId,
    ...validatedData
  } as any);
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
