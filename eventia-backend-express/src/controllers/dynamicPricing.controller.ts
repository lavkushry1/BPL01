import { Request, Response } from 'express';
import catchAsync from '../utils/catchAsync';
import { ApiError } from '../utils/apiError';
import { DynamicPricingService } from '../services/dynamicPricing.service';

// Define HTTP status codes instead of using external package
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  NOT_FOUND: 404
};

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
  
  res.status(HTTP_STATUS.OK).json(calculatedPrice);
});

const createPricingRule = catchAsync(async (req: Request, res: Response) => {
  const rule = await DynamicPricingService.savePricingRule(req.body);
  res.status(HTTP_STATUS.CREATED).json(rule);
});

const getPricingRules = catchAsync(async (req: Request, res: Response) => {
  const eventId = req.query.eventId as string | undefined;
  
  const rules = await DynamicPricingService.getPricingRules(eventId);
  res.status(HTTP_STATUS.OK).json(rules);
});

const getPricingRule = catchAsync(async (req: Request, res: Response) => {
  const rules = await DynamicPricingService.getPricingRules(undefined);
  const foundRule = rules.find(r => r.id === req.params.ruleId);
  
  if (!foundRule) {
    throw ApiError.notFound('Pricing rule not found');
  }
  res.status(HTTP_STATUS.OK).json(foundRule);
});

const updatePricingRule = catchAsync(async (req: Request, res: Response) => {
  const rule = await DynamicPricingService.savePricingRule({
    id: req.params.ruleId,
    ...req.body
  });
  res.status(HTTP_STATUS.OK).json(rule);
});

const deletePricingRule = catchAsync(async (req: Request, res: Response) => {
  await DynamicPricingService.deletePricingRule(req.params.ruleId);
  res.status(HTTP_STATUS.NO_CONTENT).send();
});

export default {
  calculatePrice,
  createPricingRule,
  getPricingRules,
  getPricingRule,
  updatePricingRule,
  deletePricingRule
};
