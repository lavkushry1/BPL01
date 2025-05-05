/**
 * API Service Type Definitions
 */

// API Response types
export interface ApiResponse<T = any> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

// Error types
export interface ApiError {
  status: number;
  code: string;
  message: string;
  details?: any;
}

// Common API parameters
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface SortParams {
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface FilterParams {
  [key: string]: any;
}

// Request options
export interface RequestOptions {
  headers?: Record<string, string>;
  timeout?: number;
  signal?: AbortSignal;
}

// API Client interface
export interface ApiClient {
  get<T>(url: string, options?: RequestOptions): Promise<T>;
  post<T>(url: string, data: any, options?: RequestOptions): Promise<T>;
  put<T>(url: string, data: any, options?: RequestOptions): Promise<T>;
  patch<T>(url: string, data: any, options?: RequestOptions): Promise<T>;
  delete<T>(url: string, options?: RequestOptions): Promise<T>;
} 