import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/apiError';
import { ApiResponse } from '../utils/apiResponse';
import { db } from '../db';
import { asyncHandler } from '../utils/asyncHandler';
import { logger } from '../utils/logger';

/**
 * Controller for public endpoints that don't require authentication
 */
export class PublicController {
  /**
   * Generate a QR code for payment
   */
  static generateQrCode = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { data } = req.body;
      
      if (!data || typeof data !== 'string') {
        throw new ApiError(400, 'Invalid data format. Expected a string.', 'INVALID_DATA_FORMAT');
      }

      // Generate a QR code URL from a public service
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data)}`;

      // Set cache headers for 1 day (86400 seconds)
      res.setHeader('Cache-Control', 'public, max-age=86400');
      
      return ApiResponse.success(
        res,
        200,
        'QR code generated successfully',
        { qrCodeUrl }
      );
    } catch (error) {
      logger.error('Error generating QR code:', error);
      throw new ApiError(500, 'Failed to generate QR code', 'QR_CODE_GENERATION_ERROR');
    }
  });

  /**
   * Get active UPI setting
   */
  static getActiveUpiSetting = asyncHandler(async (req: Request, res: Response) => {
    try {
      logger.info('Accessing public UPI settings endpoint');

      // Define a default UPI setting to use when database lookup fails
      const defaultUpiSetting = {
        id: 'default',
        upivpa: '9122036484@hdfc',  // The required UPI ID as default
        discountamount: 0,
        isactive: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      try {
        // Try to get active UPI setting from database
        const activeSetting = await db('upi_settings')
          .select('*')
          .where({ isactive: true })
          .first();

        if (activeSetting) {
          logger.info(`Found active UPI setting: ${activeSetting.upivpa}`);
          
          // Set cache headers for 1 hour (3600 seconds)
          res.setHeader('Cache-Control', 'public, max-age=3600');
          
          return ApiResponse.success(
            res,
            200,
            'Active UPI setting retrieved successfully',
            activeSetting
          );
        } else {
          logger.warn('No active UPI setting found, using default');
          
          // Set cache headers for 1 hour (3600 seconds)
          res.setHeader('Cache-Control', 'public, max-age=3600');
          
          return ApiResponse.success(
            res,
            200,
            'Using default UPI setting as no active setting found',
            defaultUpiSetting
          );
        }
      } catch (dbError) {
        logger.error('Database error when fetching UPI settings:', dbError);

        // Always return default UPI setting on error to ensure app keeps working
        return ApiResponse.success(
          res,
          200,
          'Using default UPI setting due to database error',
          defaultUpiSetting
        );
      }
    } catch (error) {
      logger.error('Unexpected error in UPI settings endpoint:', error);

      // Always provide a fallback even on unexpected errors
      return ApiResponse.success(
        res,
        200,
        'Using default UPI setting due to unexpected error',
        {
          id: 'fallback',
          upivpa: '9122036484@hdfc',
          discountamount: 0,
          isactive: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      );
    }
  });
} 