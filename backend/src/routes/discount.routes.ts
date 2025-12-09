import { Router } from 'express';
import { DiscountController } from '../controllers/discount.controller';
import { auth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import * as discountValidation from '../validations/discount.validation';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Discount:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         code:
 *           type: string
 *         description:
 *           type: string
 *           nullable: true
 *         type:
 *           type: string
 *           enum: [PERCENTAGE, FIXED]
 *         value:
 *           type: number
 *         max_uses:
 *           type: integer
 *           nullable: true
 *         used_count:
 *           type: integer
 *           default: 0
 *         min_amount:
 *           type: number
 *           nullable: true
 *         start_date:
 *           type: string
 *           format: date-time
 *         end_date:
 *           type: string
 *           format: date-time
 *         is_active:
 *           type: boolean
 *           default: true
 *         event_specific:
 *           type: boolean
 *           default: false
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *
 *     DiscountResponse:
 *       type: object
 *       properties:
 *         discount_id:
 *           type: string
 *           format: uuid
 *         code:
 *           type: string
 *         description:
 *           type: string
 *           nullable: true
 *         discount_amount:
 *           type: number
 *         original_amount:
 *           type: number
 *         final_amount:
 *           type: number
 *         discount_type:
 *           type: string
 *           enum: [PERCENTAGE, FIXED]
 *         discount_value:
 *           type: number
 */

/**
 * @swagger
 * tags:
 *   name: Discounts
 *   description: Discount management endpoints
 */

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
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
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
 *           format: uuid
 *         description: Filter by event ID
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by code or description
 *     responses:
 *       200:
 *         description: Discounts fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Discounts fetched successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     discounts:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Discount'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/', auth('admin'), DiscountController.getAllDiscounts);

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
 *           format: uuid
 *         description: Discount ID
 *     responses:
 *       200:
 *         description: Discount fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Discount fetched successfully
 *                 data:
 *                   $ref: '#/components/schemas/Discount'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Discount not found
 *       500:
 *         description: Server error
 */
router.get(
  '/:id',
  auth('admin'),
  validate(discountValidation.getByIdSchema),
  DiscountController.getDiscountById
);

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
 *         description: Discount code
 *     responses:
 *       200:
 *         description: Discount fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Discount fetched successfully
 *                 data:
 *                   $ref: '#/components/schemas/Discount'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Discount not found
 *       500:
 *         description: Server error
 */
router.get(
  '/code/:code',
  auth(),
  validate(discountValidation.getByCodeSchema),
  DiscountController.getDiscountByCode
);

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
 *             type: object
 *             required:
 *               - code
 *               - type
 *               - value
 *               - start_date
 *               - end_date
 *             properties:
 *               code:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 30
 *                 description: Unique discount code
 *               type:
 *                 type: string
 *                 enum: [PERCENTAGE, FIXED]
 *                 description: Type of discount (percentage or fixed amount)
 *               value:
 *                 type: number
 *                 format: float
 *                 description: Discount value (percentage or fixed amount)
 *               max_uses:
 *                 type: integer
 *                 description: Maximum number of times the discount can be used (0 for unlimited)
 *               min_amount:
 *                 type: number
 *                 format: float
 *                 description: Minimum order amount required to apply discount
 *               start_date:
 *                 type: string
 *                 format: date-time
 *                 description: Start date when discount becomes active
 *               end_date:
 *                 type: string
 *                 format: date-time
 *                 description: End date when discount expires
 *               is_active:
 *                 type: boolean
 *                 description: Whether the discount is active
 *                 default: true
 *               description:
 *                 type: string
 *                 description: Description of the discount
 *               event_ids:
 *                 type: array
 *                 description: List of event IDs this discount applies to (empty for all events)
 *                 items:
 *                   type: string
 *                   format: uuid
 *     responses:
 *       201:
 *         description: Discount created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 statusCode:
 *                   type: integer
 *                   example: 201
 *                 message:
 *                   type: string
 *                   example: Discount created successfully
 *                 data:
 *                   $ref: '#/components/schemas/Discount'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post(
  '/',
  auth('admin'),
  validate(discountValidation.createDiscountSchema),
  DiscountController.createDiscount
);

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
 *           format: uuid
 *         description: Discount ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 30
 *               type:
 *                 type: string
 *                 enum: [PERCENTAGE, FIXED]
 *               value:
 *                 type: number
 *                 format: float
 *               max_uses:
 *                 type: integer
 *               min_amount:
 *                 type: number
 *                 format: float
 *               start_date:
 *                 type: string
 *                 format: date-time
 *               end_date:
 *                 type: string
 *                 format: date-time
 *               is_active:
 *                 type: boolean
 *               description:
 *                 type: string
 *               event_ids:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *     responses:
 *       200:
 *         description: Discount updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Discount updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/Discount'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Discount not found
 *       500:
 *         description: Server error
 */
router.put(
  '/:id',
  auth('admin'),
  validate(discountValidation.updateDiscountSchema),
  DiscountController.updateDiscount
);

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
 *           format: uuid
 *         description: Discount ID
 *     responses:
 *       200:
 *         description: Discount deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Discount deleted successfully
 *                 data:
 *                   type: object
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Discount not found
 *       500:
 *         description: Server error
 */
router.delete(
  '/:id',
  auth('admin'),
  validate(discountValidation.getByIdSchema),
  DiscountController.deleteDiscount
);

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
 *             required:
 *               - code
 *               - amount
 *             properties:
 *               code:
 *                 type: string
 *                 description: Discount code to apply
 *               amount:
 *                 type: number
 *                 format: float
 *                 description: Total amount before discount
 *               event_id:
 *                 type: string
 *                 format: uuid
 *                 description: Event ID (optional, for event-specific discounts)
 *     responses:
 *       200:
 *         description: Discount applied successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Discount applied successfully
 *                 data:
 *                   $ref: '#/components/schemas/DiscountResponse'
 *       400:
 *         description: Validation error or invalid discount
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 statusCode:
 *                   type: integer
 *                   example: 400
 *                 message:
 *                   type: string
 *                   example: Invalid discount code
 *       404:
 *         description: Discount not found
 *       500:
 *         description: Server error
 */
router.post(
  '/apply',
  validate(discountValidation.applyDiscountSchema),
  DiscountController.applyDiscount
);

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
 *                 format: float
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
 *                   $ref: '#/components/schemas/DiscountResponse'
 *       400:
 *         description: Invalid discount (not applicable, expired, usage limit reached)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Discount code has reached maximum usage limit
 *       404:
 *         description: Discount code or booking not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Invalid discount code
 *       500:
 *         description: Server error
 */
router.post(
  '/validate',
  validate(discountValidation.validateDiscountSchema),
  DiscountController.validateDiscountCode
);

/**
 * @swagger
 * /api/discounts/auto-apply:
 *   get:
 *     summary: Get auto-applied discount for a specific event
 *     tags: [Discounts]
 *     parameters:
 *       - in: query
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Event ID
 *     responses:
 *       200:
 *         description: Auto-apply discount fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Auto-apply discount fetched successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     discount:
 *                       $ref: '#/components/schemas/Discount'
 *       404:
 *         description: No auto-apply discount found for this event
 *       500:
 *         description: Server error
 */
router.get(
  '/auto-apply',
  validate(discountValidation.getAutoApplyDiscountSchema),
  DiscountController.getAutoApplyDiscount
);

export default router;
