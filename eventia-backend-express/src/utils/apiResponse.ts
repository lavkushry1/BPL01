import { Response } from 'express';

/**
 * Utility for sending standardized API responses
 */
export class ApiResponse {
  /**
   * Send a successful response
   * 
   * @param res Express response object
   * @param data Response data or status code
   * @param message Success message
   * @param meta Response metadata (optional)
   */
  static success(
    res: Response,
    data: any = null,
    message: string = 'Success',
    meta: Record<string, any> = {}
  ): Response {
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
  static created(
    res: Response,
    data: any = null,
    message: string = 'Created successfully'
  ): Response {
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
  static paginated(
    res: Response,
    statusCode: number = 200,
    message: string = 'Success',
    data: any[],
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    }
  ): Response {
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
  static error(
    res: Response,
    statusCode: number = 500,
    message: string = 'An error occurred',
    errorCode: string = 'INTERNAL_ERROR',
    errors: any = null
  ): Response {
    const response: Record<string, any> = {
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
