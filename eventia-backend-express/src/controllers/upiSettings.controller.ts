import { Request, Response } from 'express';
import { ApiError } from '../utils/apiError';
import { asyncHandler } from '../utils/asyncHandler';
import { prisma } from '../db/prisma';

export class UpiSettingsController {
  /**
   * Get all UPI settings
   */
  static getAllSettings = asyncHandler(async (req: Request, res: Response) => {
    const settings = await prisma.upiSettings.findMany({
      orderBy: { created_at: 'desc' }
    });

    res.status(200).json({
      success: true,
      data: settings
    });
  });

  /**
   * Get active UPI setting
   */
  static getActiveSetting = asyncHandler(async (req: Request, res: Response) => {
    const setting = await prisma.upiSettings.findFirst({
      where: { isactive: true },
      orderBy: { created_at: 'desc' }
    });

    if (!setting) {
      // Return default mock if no active setting found (fallback)
      return res.status(200).json({
        success: true,
        data: {
          upivpa: '9122036484@hdfc',
          discountamount: 0,
          isactive: true
        }
      });
    }

    res.status(200).json({
      success: true,
      data: setting
    });
  });

  /**
   * Create new UPI setting
   */
  static createSetting = asyncHandler(async (req: Request, res: Response) => {
    const { upivpa, discountamount, isactive } = req.body;

    if (!upivpa) {
      throw ApiError.badRequest('UPI VPA is required');
    }

    // If setting as active, deactivate others
    if (isactive) {
      await prisma.upiSettings.updateMany({
        where: { isactive: true },
        data: { isactive: false }
      });
    }

    const setting = await prisma.upiSettings.create({
      data: {
        upivpa,
        discountamount: discountamount || 0,
        isactive: isactive || false
      }
    });

    res.status(201).json({
      success: true,
      data: setting
    });
  });

  /**
   * Update UPI setting
   */
  static updateSetting = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { upivpa, discountamount, isactive } = req.body;

    const existing = await prisma.upiSettings.findUnique({
      where: { id }
    });

    if (!existing) {
      throw ApiError.notFound('UPI setting not found');
    }

    // If setting as active, deactivate others
    if (isactive && !existing.isactive) {
      await prisma.upiSettings.updateMany({
        where: { isactive: true },
        data: { isactive: false }
      });
    }

    const setting = await prisma.upiSettings.update({
      where: { id },
      data: {
        upivpa,
        discountamount,
        isactive
      }
    });

    res.status(200).json({
      success: true,
      data: setting
    });
  });

  /**
   * Delete UPI setting
   */
  static deleteSetting = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    await prisma.upiSettings.delete({
      where: { id }
    });

    res.status(200).json({
      success: true,
      message: 'UPI setting deleted successfully'
    });
  });
}
