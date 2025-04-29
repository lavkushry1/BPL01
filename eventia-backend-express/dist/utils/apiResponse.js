"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiResponse = void 0;
/**
 * Utility for sending standardized API responses
 */
class ApiResponse {
    /**
     * Send a successful response
     *
     * @param res Express response object
     * @param data Response data or status code
     * @param message Success message
     * @param meta Response metadata (optional)
     */
    static success(res, data = null, message = 'Success', meta = {}) {
        const statusCode = typeof data === 'number' ? data : 200;
        const responseData = typeof data === 'number' ? null : data;
        return res.status(statusCode).json({
            status: 'success',
            message,
            data: responseData,
            meta,
            timestamp: new Date().toISOString()
        });
    }
    /**
     * Send a created response (201)
     *
     * @param res Express response object
     * @param data Response data
     * @param message Success message
     */
    static created(res, data = null, message = 'Created successfully') {
        return res.status(201).json({
            status: 'success',
            message,
            data,
            timestamp: new Date().toISOString()
        });
    }
    /**
     * Send a paginated response
     *
     * @param res Express response object
     * @param statusCode HTTP status code (defaults to 200)
     * @param message Success message
     * @param data Response data
     * @param pagination Pagination details
     */
    static paginated(res, statusCode = 200, message = 'Success', data, pagination) {
        return res.status(statusCode).json({
            status: 'success',
            message,
            data,
            meta: {
                pagination
            },
            timestamp: new Date().toISOString()
        });
    }
    /**
     * Send an error response
     *
     * @param res Express response object
     * @param statusCode HTTP status code
     * @param message Error message
     * @param errorCode Error code (optional)
     * @param errors Validation errors (optional)
     */
    static error(res, statusCode = 500, message = 'An error occurred', errorCode = 'INTERNAL_ERROR', errors = null) {
        const response = {
            status: 'error',
            message,
            error_code: errorCode,
            timestamp: new Date().toISOString()
        };
        if (errors) {
            response.errors = errors;
        }
        return res.status(statusCode).json(response);
    }
}
exports.ApiResponse = ApiResponse;
