"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiResponse = void 0;
/**
 * Utility class for standardized API responses
 */
class ApiResponse {
    /**
     * Send a success response
     * @param res Express response object
     * @param statusCode HTTP status code
     * @param message Success message
     * @param data Response data
     * @param options Additional response options
     */
    static success(res, statusCode = 200, message = 'Success', data = null, options = {}) {
        // Set headers if provided
        if (options.headers) {
            Object.entries(options.headers).forEach(([key, value]) => {
                res.setHeader(key, value);
            });
        }
        return res.status(statusCode).json({
            success: true,
            message,
            data,
            metadata: options.metadata || {},
            ...(options.pagination && { pagination: options.pagination }),
        });
    }
    /**
     * Send an error response
     * @param res Express response object
     * @param statusCode HTTP status code
     * @param message Error message
     * @param errorCode Error code for client reference
     * @param errors Additional error details
     */
    static error(res, statusCode = 500, message = 'Internal Server Error', errorCode = 'INTERNAL_SERVER_ERROR', errors = null) {
        return res.status(statusCode).json({
            success: false,
            message,
            errorCode,
            errors,
        });
    }
    /**
     * Send a paginated list response
     * @param res Express response object
     * @param data List data
     * @param page Current page
     * @param limit Items per page
     * @param total Total number of items
     * @param message Success message
     */
    static paginated(res, data, page, limit, total, message = 'Data retrieved successfully') {
        const totalPages = Math.ceil(total / limit);
        return this.success(res, 200, message, data, {
            pagination: {
                page,
                limit,
                total,
                totalPages
            }
        });
    }
    /**
     * Send a created resource response
     * @param res Express response object
     * @param data Created resource data
     * @param message Success message
     */
    static created(res, data, message = 'Resource created successfully') {
        return this.success(res, 201, message, data);
    }
    /**
     * Send a no content response
     * @param res Express response object
     */
    static noContent(res) {
        return res.status(204).end();
    }
}
exports.ApiResponse = ApiResponse;
//# sourceMappingURL=apiResponse.js.map