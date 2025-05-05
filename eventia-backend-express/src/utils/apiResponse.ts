import { Response } from 'express';

export interface ApiResponseOptions {
  statusCode?: number;
  metadata?: Record<string, any>;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  headers?: Record<string, string>;
  [key: string]: any; // Allow for additional arbitrary properties
}

/**
 * Utility class for standardized API responses
 */
export class ApiResponse {
  /**
   * Send a success response
   * @param res Express response object
   * @param statusCode HTTP status code
   * @param message Success message
   * @param data Response data
   * @param options Additional response options
   */
  static success(
    res: Response, 
    statusCode: number = 200,
    message: string = 'Success', 
    data: any = null,
    options: ApiResponseOptions = {}
  ) {
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
  static error(
    res: Response,
    statusCode: number = 500,
    message: string = 'Internal Server Error',
    errorCode: string = 'INTERNAL_SERVER_ERROR',
    errors: any = null
  ) {
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
  static paginated(
    res: Response,
    data: any[],
    page: number,
    limit: number,
    total: number,
    message: string = 'Data retrieved successfully'
  ) {
    const totalPages = Math.ceil(total / limit);
    
    return this.success(
      res, 
      200, 
      message, 
      data, 
      {
        pagination: {
          page,
          limit,
          total,
          totalPages
        }
      }
    );
  }

  /**
   * Send a created resource response
   * @param res Express response object
   * @param data Created resource data
   * @param message Success message
   */
  static created(
    res: Response,
    data: any,
    message: string = 'Resource created successfully'
  ) {
    return this.success(res, 201, message, data);
  }

  /**
   * Send a no content response
   * @param res Express response object
   */
  static noContent(res: Response) {
    return res.status(204).end();
  }
}
