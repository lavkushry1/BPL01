import { z } from 'zod';

export const calculatePriceSchema = z.object({
  eventId: z.string().uuid('Invalid Event ID'),
  ticketCategoryId: z.string().uuid('Invalid Ticket Category ID'),
  quantity: z.string().transform(Number).pipe(z.number().int().positive()).optional().default('1'),
});

export const createPricingRuleSchema = z.object({
  eventId: z.string().uuid('Invalid Event ID').optional(), // Optional because some rules might be global
  ticketCategoryId: z.string().uuid('Invalid Ticket Category ID').optional(),
  name: z.string().min(3, 'Rule name is required'),
  type: z.enum(['TIME_BASED', 'DEMAND_BASED', 'INVENTORY_BASED']),
  conditions: z.record(z.any()), // Flexible JSON for conditions
  adjustments: z.record(z.any()), // Flexible JSON for adjustments
  priority: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

export const updatePricingRuleSchema = createPricingRuleSchema.partial();
