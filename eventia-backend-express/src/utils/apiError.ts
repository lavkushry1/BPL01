import { ErrorCode } from './errorCodes';

/**
 * Standard API Error class for consistent error handling
 */
export class ApiError extends Error {
  statusCode: number;
  code: string;
  details?: any;
  isOperational: boolean;

  /**
   * Create an API error
   * @param statusCode HTTP status code
   * @param message Error message
   * @param code Error code for client-side error handling
   * @param details Additional error details
   */
  constructor(
    statusCode: number,
    message: string,
    code: string = ErrorCode.INTERNAL_ERROR,
    details?: any
  ) {
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
  static badRequest(message: string, code: string = ErrorCode.INVALID_INPUT, details?: any): ApiError {
    return new ApiError(400, message, code, details);
  }

  /**
   * Create a 401 Unauthorized error
   */
  static unauthorized(message: string = 'Unauthorized', code: string = ErrorCode.NOT_AUTHENTICATED, details?: any): ApiError {
    return new ApiError(401, message, code, details);
  }

  /**
   * Create a 403 Forbidden error
   */
  static forbidden(message: string = 'Forbidden', code: string = ErrorCode.FORBIDDEN, details?: any): ApiError {
    return new ApiError(403, message, code, details);
  }

  /**
   * Create a 404 Not Found error
   */
  static notFound(message: string = 'Resource not found', code: string = ErrorCode.RESOURCE_NOT_FOUND, details?: any): ApiError {
    return new ApiError(404, message, code, details);
  }

  /**
   * Create a 409 Conflict error
   */
  static conflict(message: string, code: string = ErrorCode.DUPLICATE_RESOURCE, details?: any): ApiError {
    return new ApiError(409, message, code, details);
  }

  /**
   * Create a 422 Unprocessable Entity error
   */
  static validationError(message: string = 'Validation error', code: string = ErrorCode.VALIDATION_ERROR, details?: any): ApiError {
    return new ApiError(422, message, code, details);
  }

  /**
   * Create a 500 Internal Server Error
   */
  static internal(message: string = 'Internal server error', code: string = ErrorCode.INTERNAL_ERROR, details?: any): ApiError {
    return new ApiError(500, message, code, details);
  }
}
