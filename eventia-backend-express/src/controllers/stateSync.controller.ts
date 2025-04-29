import { Request, Response, NextFunction } from 'express';
import { StateSyncService } from '../services/stateSync.service';
import { ApiResponse } from '../utils/apiResponse';
import { ApiError } from '../utils/apiError';

/**
 * @class StateSyncController
 * @description Controller for managing state synchronization and seat locks
 */
export class StateSyncController {
  /**
   * Create a seat lock
   * @route POST /api/v1/state/locks
   */
  static async createSeatLock(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { seatId, userId, duration } = req.body;
      
      const success = await StateSyncService.acquireSeatLock(
        seatId, 
        userId, 
        duration || 300 // Default 5 minutes
      );
      
      if (!success) {
        throw new ApiError(409, 'Seat is already locked by another user', 'RESOURCE_CONFLICT');
      }
      
      ApiResponse.success(res, 201, 'Seat lock created successfully', { 
        seatId, 
        userId,
        expiresIn: duration || 300,
        status: 'active'
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Release a seat lock
   * @route DELETE /api/v1/state/locks
   */
  static async releaseSeatLock(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { seatId, userId } = req.body;
      
      await StateSyncService.releaseSeatLock(seatId, userId);
      
      ApiResponse.success(res, 200, 'Seat lock released successfully');
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Check a seat lock
   * @route GET /api/v1/state/locks/:seatId
   */
  static async checkSeatLock(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { seatId } = req.params;
      
      const lock = await StateSyncService.checkSeatLock(seatId);
      
      if (!lock) {
        ApiResponse.success(res, 200, 'Seat is not locked', { 
          seatId,
          isLocked: false
        });
        return;
      }
      
      ApiResponse.success(res, 200, 'Seat lock information', {
        seatId,
        isLocked: true,
        userId: lock.userId,
        expiresAt: lock.expiresAt
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Bulk check seat locks
   * @route POST /api/v1/state/locks/bulk-check
   */
  static async bulkCheckSeatLocks(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { seatIds } = req.body;
      
      const result = await StateSyncService.bulkCheckAvailability(seatIds);
      
      ApiResponse.success(res, 200, 'Bulk seat availability checked', result);
    } catch (error) {
      next(error);
    }
  }
} 