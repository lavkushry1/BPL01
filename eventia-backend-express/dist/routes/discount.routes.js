"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const discount_controller_1 = require("../controllers/discount.controller");
const validate_1 = require("../middleware/validate");
const auth_1 = require("../middleware/auth");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
/**
 * @swagger
 * tags:
 *   name: Discounts
 *   description: Discount management endpoints
 */
// Validation schemas
const createDiscountSchema = zod_1.z.object({
    body: zod_1.z.object({
        code: zod_1.z.string().min(3).max(30),
        type: zod_1.z.enum(['PERCENTAGE', 'FIXED']),
        value: zod_1.z.number().positive(),
        maxUses: zod_1.z.number().int().min(0).optional(),
        minAmount: zod_1.z.number().min(0).optional(),
        startDate: zod_1.z.string().datetime(),
        endDate: zod_1.z.string().datetime(),
        isActive: zod_1.z.boolean().optional(),
        description: zod_1.z.string().optional(),
        eventIds: zod_1.z.array(zod_1.z.string()).optional(),
    }),
});
const updateDiscountSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string(),
    }),
    body: zod_1.z.object({
        code: zod_1.z.string().min(3).max(30).optional(),
        type: zod_1.z.enum(['PERCENTAGE', 'FIXED']).optional(),
        value: zod_1.z.number().positive().optional(),
        maxUses: zod_1.z.number().int().min(0).optional(),
        minAmount: zod_1.z.number().min(0).optional(),
        startDate: zod_1.z.string().datetime().optional(),
        endDate: zod_1.z.string().datetime().optional(),
        isActive: zod_1.z.boolean().optional(),
        description: zod_1.z.string().optional(),
        eventIds: zod_1.z.array(zod_1.z.string()).optional(),
    }),
});
const applyDiscountSchema = zod_1.z.object({
    body: zod_1.z.object({
        code: zod_1.z.string().min(1),
        amount: zod_1.z.number().positive(),
        eventId: zod_1.z.string().optional(),
    }),
});
const validateDiscountSchema = zod_1.z.object({
    body: zod_1.z.object({
        code: zod_1.z.string().min(1),
        booking_id: zod_1.z.string().uuid(),
        total_amount: zod_1.z.number().positive(),
    }),
});
/**
 * @swagger
 * /api/v1/discounts:
 *   get:
 *     summary: Get all discounts with pagination
 *     tags: [Discounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items per page
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: eventId
 *         schema:
 *           type: string
 *         description: Filter by event ID
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by code or description
 *     responses:
 *       200:
 *         description: Discounts fetched successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/', (0, auth_1.auth)('admin'), discount_controller_1.DiscountController.getAllDiscounts);
/**
 * @swagger
 * /api/v1/discounts/{id}:
 *   get:
 *     summary: Get discount by ID
 *     tags: [Discounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Discount fetched successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Discount not found
 *       500:
 *         description: Server error
 */
router.get('/:id', (0, auth_1.auth)('admin'), discount_controller_1.DiscountController.getDiscountById);
/**
 * @swagger
 * /api/v1/discounts/code/{code}:
 *   get:
 *     summary: Get discount by code
 *     tags: [Discounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Discount fetched successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Discount not found
 *       500:
 *         description: Server error
 */
router.get('/code/:code', (0, auth_1.auth)(), discount_controller_1.DiscountController.getDiscountByCode);
/**
 * @swagger
 * /api/v1/discounts:
 *   post:
 *     summary: Create a new discount
 *     tags: [Discounts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DiscountCreate'
 *     responses:
 *       201:
 *         description: Discount created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/', (0, auth_1.auth)('admin'), (0, validate_1.validate)(createDiscountSchema), discount_controller_1.DiscountController.createDiscount);
/**
 * @swagger
 * /api/v1/discounts/{id}:
 *   put:
 *     summary: Update discount
 *     tags: [Discounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DiscountUpdate'
 *     responses:
 *       200:
 *         description: Discount updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Discount not found
 *       500:
 *         description: Server error
 */
router.put('/:id', (0, auth_1.auth)('admin'), (0, validate_1.validate)(updateDiscountSchema), discount_controller_1.DiscountController.updateDiscount);
/**
 * @swagger
 * /api/v1/discounts/{id}:
 *   delete:
 *     summary: Delete discount
 *     tags: [Discounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Discount deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Discount not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', (0, auth_1.auth)('admin'), discount_controller_1.DiscountController.deleteDiscount);
/**
 * @swagger
 * /api/v1/discounts/apply:
 *   post:
 *     summary: Validate and apply discount
 *     tags: [Discounts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *               amount:
 *                 type: number
 *               eventId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Discount applied successfully
 *       400:
 *         description: Validation error or invalid discount
 *       404:
 *         description: Discount not found
 *       500:
 *         description: Server error
 */
router.post('/apply', (0, validate_1.validate)(applyDiscountSchema), discount_controller_1.DiscountController.applyDiscount);
/**
 * @swagger
 * /api/discounts/validate:
 *   post:
 *     summary: Validate a discount code and calculate applicable discount
 *     tags: [Discounts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - booking_id
 *               - total_amount
 *             properties:
 *               code:
 *                 type: string
 *                 description: The discount code
 *               booking_id:
 *                 type: string
 *                 format: uuid
 *                 description: The booking ID
 *               total_amount:
 *                 type: number
 *                 description: The total amount before discount
 *     responses:
 *       200:
 *         description: Discount validation successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     discount_id:
 *                       type: string
 *                       format: uuid
 *                     code:
 *                       type: string
 *                     description:
 *                       type: string
 *                       nullable: true
 *                     discount_amount:
 *                       type: number
 *                     original_amount:
 *                       type: number
 *                     final_amount:
 *                       type: number
 *                     discount_type:
 *                       type: string
 *                       enum: [PERCENTAGE, FIXED]
 *                     discount_value:
 *                       type: number
 *       400:
 *         description: Invalid discount (not applicable, expired, usage limit reached)
 *       404:
 *         description: Discount code or booking not found
 *       500:
 *         description: Server error
 */
router.post('/discounts/validate', (0, validate_1.validate)(validateDiscountSchema), discount_controller_1.DiscountController.validateDiscount);
exports.default = router;
