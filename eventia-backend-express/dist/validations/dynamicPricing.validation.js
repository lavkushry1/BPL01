"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = require("zod");
const custom_validation_1 = require("./custom.validation");
const calculatePrice = zod_1.z.object({
    query: zod_1.z.object({
        eventId: zod_1.z.string().refine(val => (0, custom_validation_1.objectId)(val)),
        ticketCategoryId: zod_1.z.string().refine(val => (0, custom_validation_1.objectId)(val)),
        quantity: zod_1.z.string().optional().transform(val => val ? parseInt(val, 10) : 1)
            .refine(val => val > 0, { message: "Quantity must be greater than 0" })
    }),
    body: zod_1.z.object({}),
    params: zod_1.z.object({})
});
const createPricingRule = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(3),
        description: zod_1.z.string().optional(),
        type: zod_1.z.enum(['TIME_BASED', 'INVENTORY_BASED', 'DEMAND_BASED', 'CUSTOM']),
        conditions: zod_1.z.record(zod_1.z.any()),
        adjustmentType: zod_1.z.enum(['PERCENTAGE', 'FIXED']),
        adjustmentValue: zod_1.z.number(),
        priority: zod_1.z.number().int().min(1),
        isActive: zod_1.z.boolean().default(true),
        isGlobal: zod_1.z.boolean().optional(),
        eventId: zod_1.z.string().refine(val => (0, custom_validation_1.objectId)(val)).optional()
    }),
    query: zod_1.z.object({}),
    params: zod_1.z.object({})
});
const getPricingRules = zod_1.z.object({
    query: zod_1.z.object({
        eventId: zod_1.z.string().refine(val => (0, custom_validation_1.objectId)(val)).optional(),
        isActive: zod_1.z.enum(['true', 'false']).optional().transform(val => val === 'true')
    }),
    body: zod_1.z.object({}),
    params: zod_1.z.object({})
});
const getPricingRule = zod_1.z.object({
    params: zod_1.z.object({
        ruleId: zod_1.z.string().refine(val => (0, custom_validation_1.objectId)(val))
    }),
    body: zod_1.z.object({}),
    query: zod_1.z.object({})
});
const updatePricingRule = zod_1.z.object({
    params: zod_1.z.object({
        ruleId: zod_1.z.string().refine(val => (0, custom_validation_1.objectId)(val))
    }),
    body: zod_1.z.object({
        name: zod_1.z.string().min(3).optional(),
        description: zod_1.z.string().optional(),
        type: zod_1.z.enum(['TIME_BASED', 'INVENTORY_BASED', 'DEMAND_BASED', 'CUSTOM']).optional(),
        conditions: zod_1.z.record(zod_1.z.any()).optional(),
        adjustmentType: zod_1.z.enum(['PERCENTAGE', 'FIXED']).optional(),
        adjustmentValue: zod_1.z.number().optional(),
        priority: zod_1.z.number().int().min(1).optional(),
        isActive: zod_1.z.boolean().optional(),
        isGlobal: zod_1.z.boolean().optional(),
        eventId: zod_1.z.string().refine(val => (0, custom_validation_1.objectId)(val)).optional()
    }).refine(data => Object.keys(data).length > 0, {
        message: "At least one field must be provided for update"
    }),
    query: zod_1.z.object({})
});
const deletePricingRule = zod_1.z.object({
    params: zod_1.z.object({
        ruleId: zod_1.z.string().refine(val => (0, custom_validation_1.objectId)(val))
    }),
    body: zod_1.z.object({}),
    query: zod_1.z.object({})
});
exports.default = {
    calculatePrice,
    createPricingRule,
    getPricingRules,
    getPricingRule,
    updatePricingRule,
    deletePricingRule
};
