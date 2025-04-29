"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const apiError_1 = require("../utils/apiError");
const logger_1 = require("../utils/logger");
const config_1 = require("../config");
/**
 * Global error handler middleware
 * Handles different types of errors and sends appropriate responses
 */
const errorHandler = (err, req, res, next) => {
    // Log error
    logger_1.logger.error(`${err.name}: ${err.message}`);
    if (err.stack) {
        logger_1.logger.error(err.stack);
    }
    // Default to 500 server error
    let statusCode = 500;
    let errorMessage = 'Internal Server Error';
    let errorCode = 'INTERNAL_SERVER_ERROR';
    let errors = null;
    let details = null;
    // Handle ApiError instances
    if (err instanceof apiError_1.ApiError) {
        statusCode = err.statusCode;
        errorMessage = err.message;
        errorCode = err.code || 'ERROR';
        errors = err.details;
    }
    // Handle Prisma errors
    else if (err.name === 'PrismaClientKnownRequestError') {
        errorCode = 'DATABASE_ERROR';
        // Handle unique constraint violations (code P2002)
        if (err.code === 'P2002') {
            statusCode = 409;
            errorMessage = 'A record with the provided values already exists';
            errorCode = 'UNIQUE_CONSTRAINT_VIOLATION';
            details = {
                fields: err.meta?.target || []
            };
        }
        // Handle foreign key constraint violations (code P2003)
        else if (err.code === 'P2003') {
            statusCode = 400;
            errorMessage = 'Related record not found';
            errorCode = 'FOREIGN_KEY_CONSTRAINT_VIOLATION';
        }
    }
    // Handle validation errors
    else if (err.name === 'ValidationError') {
        statusCode = 422;
        errorMessage = 'Validation Error';
        errorCode = 'VALIDATION_ERROR';
        errors = err.errors;
    }
    // Handle JWT errors
    else if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        errorMessage = 'Invalid token';
        errorCode = 'INVALID_TOKEN';
    }
    else if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        errorMessage = 'Token expired';
        errorCode = 'TOKEN_EXPIRED';
    }
    // Handle Knex.js errors
    else if (err.name === 'KnexTimeoutError') {
        errorCode = 'DATABASE_TIMEOUT';
    }
    // Prepare response object
    const responseObj = {
        status: 'error',
        code: errorCode,
        message: errorMessage
    };
    // Add stack trace in development mode
    if (config_1.config.isDevelopment) {
        responseObj.stack = err.stack;
    }
    // Add validation errors if present
    if (errors) {
        responseObj.errors = errors;
    }
    // Add additional details if present
    if (details && config_1.config.isDevelopment) {
        responseObj.details = details;
    }
    res.status(statusCode).json(responseObj);
};
exports.errorHandler = errorHandler;
