import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../../utils/apiError';
import { ApiResponse } from '../../utils/apiResponse';
import { db } from '../../db';
import { asyncHandler } from '../../utils/asyncHandler';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../utils/logger';
import { clearCache } from '../../middleware/cache';
import * as z from 'zod';

// Zod schema for UPI settings validation
const upiSettingSchema = z.object({
  upivpa: z.string()
    .min(3, { message: 'UPI VPA must be at least 3 characters' })
    .max(100, { message: 'UPI VPA cannot exceed 100 characters' })
    .regex(/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/, { 
      message: 'UPI VPA must be in a valid format (e.g., example@upi)' 
    }),
  discountamount: z.number()
    .min(0, { message: 'Discount amount cannot be negative' })
    .optional()
    .default(0),
  isactive: z.boolean().optional().default(false)
});

// Cache key pattern for UPI settings
const UPI_CACHE_PATTERN = 'public:upi:*';

/**
 * Controller for UPI settings management in admin panel
 */
export class UpiSettingsController {
    /**
     * Get all UPI settings
     */
    static getAllUpiSettings = asyncHandler(async (req: Request, res: Response) => {
        try {
            const upiSettings = await db('upi_settings')
                .select('*')
                .orderBy('created_at', 'desc');

            return ApiResponse.success(
                res,
                200,
                'UPI settings retrieved successfully',
                upiSettings
            );
        } catch (error) {
            logger.error('Error fetching UPI settings:', error);
            throw new ApiError(500, 'Failed to retrieve UPI settings', 'UPI_SETTINGS_FETCH_ERROR');
        }
    });

    /**
     * Get UPI setting by ID
     */
    static getUpiSettingById = asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;

        if (!id || typeof id !== 'string') {
            throw new ApiError(400, 'Invalid UPI setting ID', 'INVALID_ID_FORMAT');
        }

        try {
            const upiSetting = await db('upi_settings')
                .select('*')
                .where({ id })
                .first();

            if (!upiSetting) {
                throw new ApiError(404, 'UPI setting not found', 'UPI_SETTING_NOT_FOUND');
            }

            return ApiResponse.success(
                res,
                200,
                'UPI setting retrieved successfully',
                upiSetting
            );
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            logger.error(`Error fetching UPI setting with ID ${id}:`, error);
            throw new ApiError(500, 'Failed to retrieve UPI setting', 'UPI_SETTING_FETCH_ERROR');
        }
    });

    /**
     * Create a new UPI setting
     */
    static createUpiSetting = [
        // Clear cache after creating new UPI setting
        asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            try {
                // Validate request body against Zod schema
                const validatedData = upiSettingSchema.parse(req.body);
                req.body = validatedData;
                next();
            } catch (error) {
                if (error instanceof z.ZodError) {
                    const errorsMessage = error.errors.map(err => `${err.path}: ${err.message}`).join(', ');
                    throw new ApiError(400, `Validation failed: ${errorsMessage}`, 'VALIDATION_ERROR');
                }
                throw error;
            }
        }), 

        clearCache(UPI_CACHE_PATTERN),
        
        asyncHandler(async (req: Request, res: Response) => {
            const { upivpa, discountamount = 0, isactive = true } = req.body;

            try {
                // Start a transaction
                const trx = await db.transaction();

                try {
                    // If setting isactive=true, deactivate all other settings first
                    if (isactive) {
                        await trx('upi_settings')
                            .update({ isactive: false });
                    }

                    // Create new UPI setting
                    const [newUpiSetting] = await trx('upi_settings')
                        .insert({
                            id: uuidv4(),
                            upivpa,
                            discountamount,
                            isactive,
                            created_at: trx.fn.now(),
                            updated_at: trx.fn.now()
                        })
                        .returning('*');

                    // Commit transaction
                    await trx.commit();

                    // Log the successful creation
                    logger.info(`Created new UPI setting: ${upivpa}, isActive: ${isactive}`);

                    return ApiResponse.success(
                        res,
                        201,
                        'UPI setting created successfully',
                        newUpiSetting
                    );
                } catch (error) {
                    // Rollback transaction on error
                    await trx.rollback();
                    throw error;
                }
            } catch (error) {
                logger.error('Error creating UPI setting:', error);
                throw new ApiError(500, 'Failed to create UPI setting', 'UPI_SETTING_CREATION_ERROR');
            }
        })
    ];

    /**
     * Update a UPI setting
     */
    static updateUpiSetting = [
        // Validate and parse request data
        asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            try {
                // Create a partial schema for updates
                const partialSchema = upiSettingSchema.partial();
                const validatedData = partialSchema.parse(req.body);
                req.body = validatedData;
                next();
            } catch (error) {
                if (error instanceof z.ZodError) {
                    const errorsMessage = error.errors.map(err => `${err.path}: ${err.message}`).join(', ');
                    throw new ApiError(400, `Validation failed: ${errorsMessage}`, 'VALIDATION_ERROR');
                }
                throw error;
            }
        }),
        
        // Clear cache after updating
        clearCache(UPI_CACHE_PATTERN),
        
        asyncHandler(async (req: Request, res: Response) => {
            const { id } = req.params;
            const { upivpa, discountamount, isactive } = req.body;

            if (!id || typeof id !== 'string') {
                throw new ApiError(400, 'Invalid UPI setting ID', 'INVALID_ID_FORMAT');
            }

            const updateData: Record<string, any> = {};
            if (upivpa !== undefined) updateData.upivpa = upivpa;
            if (discountamount !== undefined) updateData.discountamount = discountamount;
            if (isactive !== undefined) updateData.isactive = isactive;
            updateData.updated_at = db.fn.now();

            if (Object.keys(updateData).length === 1) {
                // Only updated_at is set, no actual changes
                throw new ApiError(400, 'No fields to update', 'NO_FIELDS_TO_UPDATE');
            }

            try {
                // Start a transaction
                const trx = await db.transaction();

                try {
                    // Check if setting exists
                    const existingSetting = await trx('upi_settings')
                        .select('id')
                        .where({ id })
                        .first();

                    if (!existingSetting) {
                        await trx.rollback();
                        throw new ApiError(404, 'UPI setting not found', 'UPI_SETTING_NOT_FOUND');
                    }

                    // If setting isactive=true, deactivate all other settings first
                    if (isactive) {
                        await trx('upi_settings')
                            .whereNot({ id })
                            .update({ isactive: false });
                    }

                    // Update the setting
                    const [updatedUpiSetting] = await trx('upi_settings')
                        .where({ id })
                        .update(updateData)
                        .returning('*');

                    // Commit transaction
                    await trx.commit();

                    // Log the successful update
                    logger.info(`Updated UPI setting ${id}: ${JSON.stringify(updateData)}`);

                    return ApiResponse.success(
                        res,
                        200,
                        'UPI setting updated successfully',
                        updatedUpiSetting
                    );
                } catch (error) {
                    // Rollback transaction on error
                    await trx.rollback();
                    throw error;
                }
            } catch (error) {
                if (error instanceof ApiError) {
                    throw error;
                }
                logger.error('Error updating UPI setting:', error);
                throw new ApiError(500, 'Failed to update UPI setting', 'UPI_SETTING_UPDATE_ERROR');
            }
        })
    ];

    /**
     * Delete a UPI setting
     */
    static deleteUpiSetting = [
        // Clear cache after deletion
        clearCache(UPI_CACHE_PATTERN),
        
        asyncHandler(async (req: Request, res: Response) => {
            const { id } = req.params;

            if (!id || typeof id !== 'string') {
                throw new ApiError(400, 'Invalid UPI setting ID', 'INVALID_ID_FORMAT');
            }

            try {
                // Start a transaction
                const trx = await db.transaction();

                try {
                    // Check if setting exists
                    const existingSetting = await trx('upi_settings')
                        .select('id', 'isactive')
                        .where({ id })
                        .first();

                    if (!existingSetting) {
                        await trx.rollback();
                        throw new ApiError(404, 'UPI setting not found', 'UPI_SETTING_NOT_FOUND');
                    }

                    // Don't allow deletion of active UPI setting
                    if (existingSetting.isactive) {
                        await trx.rollback();
                        throw new ApiError(400, 'Cannot delete active UPI setting', 'ACTIVE_SETTING_DELETION');
                    }

                    // Delete the setting
                    await trx('upi_settings')
                        .where({ id })
                        .delete();

                    // Commit transaction
                    await trx.commit();

                    // Log the successful deletion
                    logger.info(`Deleted UPI setting: ${id}`);

                    return ApiResponse.success(
                        res,
                        200,
                        'UPI setting deleted successfully',
                        { id }
                    );
                } catch (error) {
                    // Rollback transaction on error
                    await trx.rollback();
                    throw error;
                }
            } catch (error) {
                if (error instanceof ApiError) {
                    throw error;
                }
                logger.error('Error deleting UPI setting:', error);
                throw new ApiError(500, 'Failed to delete UPI setting', 'UPI_SETTING_DELETION_ERROR');
            }
        })
    ];

    /**
     * Get active UPI setting
     */
    static getActiveUpiSetting = asyncHandler(async (req: Request, res: Response) => {
        try {
            logger.info('Fetching active UPI setting');

            const activeSetting = await db('upi_settings')
                .select('*')
                .where({ isactive: true })
                .first();

            // Set proper cache headers
            res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour

            if (!activeSetting) {
                logger.warn('No active UPI setting found in database');

                // Return a default fallback UPI setting when none exists in database
                // This ensures the app doesn't break when no settings are configured yet
                const defaultSetting = {
                    id: 'default',
                    upivpa: '9122036484@hdfc', // Using the required UPI ID as default
                    discountamount: 0,
                    isactive: true,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                };

                return ApiResponse.success(
                    res,
                    200,
                    'Using default UPI setting as no active setting found',
                    defaultSetting
                );
            }

            logger.info(`Active UPI setting found: ${activeSetting.upivpa}`);

            return ApiResponse.success(
                res,
                200,
                'Active UPI setting retrieved successfully',
                activeSetting
            );
        } catch (error) {
            logger.error('Error fetching active UPI setting:', error);

            // Even on error, return a default UPI setting to ensure the app can function
            const fallbackSetting = {
                id: 'fallback',
                upivpa: '9122036484@hdfc', // Using the required UPI ID as fallback
                discountamount: 0,
                isactive: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            return ApiResponse.success(
                res,
                200,
                'Using fallback UPI setting due to error',
                fallbackSetting
            );
        }
    });
} 