"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiError = void 0;
/**
 * Standard API Error class for consistent error handling
 */
class ApiError extends Error {
    statusCode;
    code;
    details;
    isOperational;
    /**
     * Create an API error
     * @param statusCode HTTP status code
     * @param message Error message
     * @param code Error code for client-side error handling
     * @param details Additional error details
     */
    constructor(statusCode, message, code = 'UNKNOWN_ERROR', details) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
        this.isOperational = true; // Used to determine if error is operational or programming
        // Capture stack trace
        Error.captureStackTrace(this, this.constructor);
    }
    /**
     * Create a 400 Bad Request error
     */
    static badRequest(message, code = 'BAD_REQUEST', details) {
        return new ApiError(400, message, code, details);
    }
    /**
     * Create a 401 Unauthorized error
     */
    static unauthorized(message = 'Unauthorized', code = 'UNAUTHORIZED', details) {
        return new ApiError(401, message, code, details);
    }
    /**
     * Create a 403 Forbidden error
     */
    static forbidden(message = 'Forbidden', code = 'FORBIDDEN', details) {
        return new ApiError(403, message, code, details);
    }
    /**
     * Create a 404 Not Found error
     */
    static notFound(message = 'Resource not found', code = 'NOT_FOUND', details) {
        return new ApiError(404, message, code, details);
    }
    /**
     * Create a 409 Conflict error
     */
    static conflict(message, code = 'CONFLICT', details) {
        return new ApiError(409, message, code, details);
    }
    /**
     * Create a 422 Unprocessable Entity error
     */
    static validationError(message = 'Validation error', code = 'VALIDATION_ERROR', details) {
        return new ApiError(422, message, code, details);
    }
    /**
     * Create a 500 Internal Server Error
     */
    static internal(message = 'Internal server error', code = 'INTERNAL_ERROR', details) {
        return new ApiError(500, message, code, details);
    }
}
exports.ApiError = ApiError;
