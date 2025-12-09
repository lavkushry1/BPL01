import { Router } from 'express';
import { auth, checkAdmin } from '../../../middleware/auth';
import { UpiSettingsController } from '../../../controllers/admin/upiSettings.controller';
import { validate } from '../../../middleware/validate';
import * as upiValidations from '../../../validations/upiPayment.validations';
import { z } from 'zod';

const router = Router();

// Zod validation schemas
const createUpiSettingSchema = z.object({
    body: z.object({
        upivpa: z.string({
            required_error: 'UPI ID (VPA) is required'
        }),
        discountamount: z.number().min(0).optional().default(0),
        isactive: z.boolean().optional().default(true)
    })
});

const updateUpiSettingSchema = z.object({
    params: z.object({
        id: z.string({
            required_error: 'UPI setting ID is required'
        })
    }),
    body: z.object({
        upivpa: z.string().optional(),
        discountamount: z.number().min(0).optional(),
        isactive: z.boolean().optional()
    }).refine(data => Object.keys(data).length > 0, {
        message: 'At least one field is required for update'
    })
});

/**
 * @swagger
 * /api/v1/admin/upi-settings:
 *   get:
 *     summary: Get all UPI settings
 *     tags: [Admin, UPI]
 *     responses:
 *       200:
 *         description: List of UPI settings
 */
router.get('/', UpiSettingsController.getAllUpiSettings);

/**
 * @swagger
 * /api/v1/admin/upi-settings/active:
 *   get:
 *     summary: Get active UPI setting
 *     tags: [Admin, UPI]
 *     responses:
 *       200:
 *         description: Active UPI setting
 */
router.get('/active', UpiSettingsController.getActiveUpiSetting);

/**
 * @swagger
 * /api/v1/admin/upi-settings/{id}:
 *   get:
 *     summary: Get UPI setting by ID
 *     tags: [Admin, UPI]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: UPI setting details
 *       404:
 *         description: UPI setting not found
 */
router.get('/:id', UpiSettingsController.getUpiSettingById);

/**
 * @swagger
 * /api/v1/admin/upi-settings:
 *   post:
 *     summary: Create new UPI setting
 *     tags: [Admin, UPI]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - upivpa
 *             properties:
 *               upivpa:
 *                 type: string
 *               discountamount:
 *                 type: number
 *               isactive:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: UPI setting created
 *       400:
 *         description: Invalid input
 */
router.post('/', validate(createUpiSettingSchema),
    UpiSettingsController.createUpiSetting
);

/**
 * @swagger
 * /api/v1/admin/upi-settings/{id}:
 *   put:
 *     summary: Update UPI setting
 *     tags: [Admin, UPI]
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
 *             type: object
 *             properties:
 *               upivpa:
 *                 type: string
 *               discountamount:
 *                 type: number
 *               isactive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: UPI setting updated
 *       400:
 *         description: Invalid input
 *       404:
 *         description: UPI setting not found
 */
router.put('/:id', validate(updateUpiSettingSchema),
    UpiSettingsController.updateUpiSetting
);

/**
 * @swagger
 * /api/v1/admin/upi-settings/{id}:
 *   delete:
 *     summary: Delete UPI setting
 *     tags: [Admin, UPI]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: UPI setting deleted
 *       400:
 *         description: Cannot delete active UPI setting
 *       404:
 *         description: UPI setting not found
 */
router.delete('/:id', UpiSettingsController.deleteUpiSetting);

export default router; 