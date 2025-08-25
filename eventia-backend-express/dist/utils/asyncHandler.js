"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncHandler = void 0;
const logger_1 = require("./logger");
/**
 * Async handler to wrap controller methods
 * This eliminates the need for try/catch blocks in each controller
 * by catching errors and passing them to the global error handler
 *
 * @param fn Controller function that returns a Promise
 * @returns Express middleware function
 */
const asyncHandler = (fn) => {
    return async (req, res, next) => {
        try {
            // Execute the handler function
            return await fn(req, res, next);
        }
        catch (error) {
            // Log the error
            logger_1.logger.error('Unhandled error in async handler:', {
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
                path: req.path,
                method: req.method
            });
            // Pass to the global error handler
            next(error);
        }
    };
};
exports.asyncHandler = asyncHandler;
//# sourceMappingURL=asyncHandler.js.map