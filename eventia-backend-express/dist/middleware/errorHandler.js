"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const apiError_1 = require("../utils/apiError");
const logger_1 = require("../utils/logger");
const errorCodes_1 = require("../utils/errorCodes");
const client_1 = require("@prisma/client");
/**
 * Global error handler middleware
 * Processes all errors and returns standardized error responses
 */
const errorHandler = (err, req, res, next) => {
    // Log the error
    logger_1.logger.error({
        message: `[${req.method}] ${req.path} - ${err.message}`,
        error: err.stack,
        requestId: req.id || 'unknown',
        userId: req.user?.id || 'anonymous'
    });
    // Handle ApiError instances
    if (err instanceof apiError_1.ApiError) {
        return res.status(err.statusCode).json({
            success: false,
            error: {
                code: err.code,
                message: err.message
            },
            data: null
        });
    }
    // Handle Prisma errors
    if (err instanceof client_1.Prisma.PrismaClientKnownRequestError) {
        switch (err.code) {
            case 'P2002': // Unique constraint violation
                return res.status(409).json({
                    success: false,
                    error: {
                        code: errorCodes_1.ErrorCode.DUPLICATE_RESOURCE,
                        message: 'A resource with this identifier already exists'
                    },
                    data: null
                });
            case 'P2025': // Record not found
                return res.status(404).json({
                    success: false,
                    error: {
                        code: errorCodes_1.ErrorCode.RESOURCE_NOT_FOUND,
                        message: 'The requested resource was not found'
                    },
                    data: null
                });
            case 'P2003': // Foreign key constraint failed
                return res.status(400).json({
                    success: false,
                    error: {
                        code: errorCodes_1.ErrorCode.INVALID_INPUT,
                        message: 'Invalid reference to a related resource'
                    },
                    data: null
                });
            default:
                // Log the unknown Prisma error code for future handling
                logger_1.logger.warn(`Unhandled Prisma error code: ${err.code}`);
        }
    }
    // Handle validation errors (like Zod errors)
    if (err.name === 'ZodError') {
        return res.status(400).json({
            success: false,
            error: {
                code: errorCodes_1.ErrorCode.VALIDATION_ERROR,
                message: 'Validation error',
                details: err.message
            },
            data: null
        });
    }
    // Handle JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            error: {
                code: errorCodes_1.ErrorCode.INVALID_TOKEN,
                message: 'Invalid token'
            },
            data: null
        });
    }
    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            error: {
                code: errorCodes_1.ErrorCode.TOKEN_EXPIRED,
                message: 'Token has expired'
            },
            data: null
        });
    }
    // Default error response for unexpected errors
    return res.status(500).json({
        success: false,
        error: {
            code: errorCodes_1.ErrorCode.INTERNAL_ERROR,
            message: process.env.NODE_ENV === 'production'
                ? 'An unexpected error occurred'
                : err.message || 'Unknown error'
        },
        data: null
    });
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=errorHandler.js.map