import express from 'express';
import { validate } from '../../middleware/validate';
import dynamicPricingValidation from '../../validations/dynamicPricing.validation';
import dynamicPricingController from '../../controllers/dynamicPricing.controller';
import { authenticate, authorize } from '../../middleware/auth';

const router = express.Router();

// Calculate dynamic price for a ticket category (public route)
router.get(
  '/calculate-price',
  validate(dynamicPricingValidation.calculatePrice),
  dynamicPricingController.calculatePrice
);

// Admin routes
// Create a new pricing rule
router.post(
  '/',
  authenticate,
  authorize(['admin']),
  validate(dynamicPricingValidation.createPricingRule),
  dynamicPricingController.createPricingRule
);

// Get all pricing rules
router.get(
  '/',
  authenticate,
  authorize(['admin']),
  validate(dynamicPricingValidation.getPricingRules),
  dynamicPricingController.getPricingRules
);

// Get a pricing rule by ID
router.get(
  '/:ruleId',
  authenticate,
  authorize(['admin']),
  validate(dynamicPricingValidation.getPricingRule),
  dynamicPricingController.getPricingRule
);

// Update a pricing rule
router.put(
  '/:ruleId',
  authenticate,
  authorize(['admin']),
  validate(dynamicPricingValidation.updatePricingRule),
  dynamicPricingController.updatePricingRule
);

// Delete a pricing rule
router.delete(
  '/:ruleId',
  authenticate,
  authorize(['admin']),
  validate(dynamicPricingValidation.deletePricingRule),
  dynamicPricingController.deletePricingRule
);

export default router; 