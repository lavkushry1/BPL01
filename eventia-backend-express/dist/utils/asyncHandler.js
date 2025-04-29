"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncHandler = void 0;
/**
 * Async handler to wrap controller methods
 * This eliminates the need for try/catch blocks in each controller
 * by catching errors and passing them to the global error handler
 *
 * @param fn Controller function that returns a Promise
 * @returns Express middleware function
 */
const asyncHandler = (fn) => (req, res, next) => {
    return Promise.resolve(fn(req, res, next))
        .catch((error) => {
        next(error);
    });
};
exports.asyncHandler = asyncHandler;
