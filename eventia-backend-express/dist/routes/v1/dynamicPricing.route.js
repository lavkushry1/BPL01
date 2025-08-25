"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const validate_1 = require("../../middleware/validate");
const dynamicPricing_validation_1 = __importDefault(require("../../validations/dynamicPricing.validation"));
const dynamicPricing_controller_1 = __importDefault(require("../../controllers/dynamicPricing.controller"));
const auth_1 = require("../../middleware/auth");
const router = express_1.default.Router();
// Calculate dynamic price for a ticket category (public route)
router.get('/calculate-price', (0, validate_1.validate)(dynamicPricing_validation_1.default.calculatePrice), dynamicPricing_controller_1.default.calculatePrice);
// Admin routes
// Create a new pricing rule
router.post('/', auth_1.authenticate, (0, auth_1.authorize)(['admin']), (0, validate_1.validate)(dynamicPricing_validation_1.default.createPricingRule), dynamicPricing_controller_1.default.createPricingRule);
// Get all pricing rules
router.get('/', auth_1.authenticate, (0, auth_1.authorize)(['admin']), (0, validate_1.validate)(dynamicPricing_validation_1.default.getPricingRules), dynamicPricing_controller_1.default.getPricingRules);
// Get a pricing rule by ID
router.get('/:ruleId', auth_1.authenticate, (0, auth_1.authorize)(['admin']), (0, validate_1.validate)(dynamicPricing_validation_1.default.getPricingRule), dynamicPricing_controller_1.default.getPricingRule);
// Update a pricing rule
router.put('/:ruleId', auth_1.authenticate, (0, auth_1.authorize)(['admin']), (0, validate_1.validate)(dynamicPricing_validation_1.default.updatePricingRule), dynamicPricing_controller_1.default.updatePricingRule);
// Delete a pricing rule
router.delete('/:ruleId', auth_1.authenticate, (0, auth_1.authorize)(['admin']), (0, validate_1.validate)(dynamicPricing_validation_1.default.deletePricingRule), dynamicPricing_controller_1.default.deletePricingRule);
exports.default = router;
//# sourceMappingURL=dynamicPricing.route.js.map