"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StateSyncController = void 0;
const stateSync_service_1 = require("../services/stateSync.service");
const apiResponse_1 = require("../utils/apiResponse");
const apiError_1 = require("../utils/apiError");
/**
 * @class StateSyncController
 * @description Controller for managing state synchronization and seat locks
 */
class StateSyncController {
    /**
     * Create a seat lock
     * @route POST /api/v1/state/locks
     */
    static async createSeatLock(req, res, next) {
        try {
            const { seatId, userId, duration } = req.body;
            const success = await stateSync_service_1.StateSyncService.acquireSeatLock(seatId, userId, duration || 300 // Default 5 minutes
            );
            if (!success) {
                throw new apiError_1.ApiError(409, 'Seat is already locked by another user', 'RESOURCE_CONFLICT');
            }
            apiResponse_1.ApiResponse.success(res, 201, 'Seat lock created successfully', {
                seatId,
                userId,
                expiresIn: duration || 300,
                status: 'active'
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Release a seat lock
     * @route DELETE /api/v1/state/locks
     */
    static async releaseSeatLock(req, res, next) {
        try {
            const { seatId, userId } = req.body;
            await stateSync_service_1.StateSyncService.releaseSeatLock(seatId, userId);
            apiResponse_1.ApiResponse.success(res, 200, 'Seat lock released successfully');
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Check a seat lock
     * @route GET /api/v1/state/locks/:seatId
     */
    static async checkSeatLock(req, res, next) {
        try {
            const { seatId } = req.params;
            const lock = await stateSync_service_1.StateSyncService.checkSeatLock(seatId);
            if (!lock) {
                apiResponse_1.ApiResponse.success(res, 200, 'Seat is not locked', {
                    seatId,
                    isLocked: false
                });
                return;
            }
            apiResponse_1.ApiResponse.success(res, 200, 'Seat lock information', {
                seatId,
                isLocked: true,
                userId: lock.userId,
                expiresAt: lock.expiresAt
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Bulk check seat locks
     * @route POST /api/v1/state/locks/bulk-check
     */
    static async bulkCheckSeatLocks(req, res, next) {
        try {
            const { seatIds } = req.body;
            const result = await stateSync_service_1.StateSyncService.bulkCheckAvailability(seatIds);
            apiResponse_1.ApiResponse.success(res, 200, 'Bulk seat availability checked', result);
        }
        catch (error) {
            next(error);
        }
    }
}
exports.StateSyncController = StateSyncController;
