import { z } from 'zod';
import { objectId } from './custom.validation';

const calculatePrice = z.object({
  query: z.object({
    eventId: z.string().refine(val => objectId(val)),
    ticketCategoryId: z.string().refine(val => objectId(val)),
    quantity: z.string().optional().transform(val => val ? parseInt(val, 10) : 1)
      .refine(val => val > 0, { message: "Quantity must be greater than 0" })
  }),
  body: z.object({}),
  params: z.object({})
});

const createPricingRule = z.object({
  body: z.object({
    name: z.string().min(3),
    description: z.string().optional(),
    type: z.enum(['TIME_BASED', 'INVENTORY_BASED', 'DEMAND_BASED', 'CUSTOM']),
    conditions: z.record(z.any()),
    adjustmentType: z.enum(['PERCENTAGE', 'FIXED']),
    adjustmentValue: z.number(),
    priority: z.number().int().min(1),
    isActive: z.boolean().default(true),
    isGlobal: z.boolean().optional(),
    eventId: z.string().refine(val => objectId(val)).optional()
  }),
  query: z.object({}),
  params: z.object({})
});

const getPricingRules = z.object({
  query: z.object({
    eventId: z.string().refine(val => objectId(val)).optional(),
    isActive: z.enum(['true', 'false']).optional().transform(val => val === 'true')
  }),
  body: z.object({}),
  params: z.object({})
});

const getPricingRule = z.object({
  params: z.object({
    ruleId: z.string().refine(val => objectId(val))
  }),
  body: z.object({}),
  query: z.object({})
});

const updatePricingRule = z.object({
  params: z.object({
    ruleId: z.string().refine(val => objectId(val))
  }),
  body: z.object({
    name: z.string().min(3).optional(),
    description: z.string().optional(),
    type: z.enum(['TIME_BASED', 'INVENTORY_BASED', 'DEMAND_BASED', 'CUSTOM']).optional(),
    conditions: z.record(z.any()).optional(),
    adjustmentType: z.enum(['PERCENTAGE', 'FIXED']).optional(),
    adjustmentValue: z.number().optional(),
    priority: z.number().int().min(1).optional(),
    isActive: z.boolean().optional(),
    isGlobal: z.boolean().optional(),
    eventId: z.string().refine(val => objectId(val)).optional()
  }).refine(data => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update"
  }),
  query: z.object({})
});

const deletePricingRule = z.object({
  params: z.object({
    ruleId: z.string().refine(val => objectId(val))
  }),
  body: z.object({}),
  query: z.object({})
});

export default {
  calculatePrice,
  createPricingRule,
  getPricingRules,
  getPricingRule,
  updatePricingRule,
  deletePricingRule
}; 