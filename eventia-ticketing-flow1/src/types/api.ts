/**
 * @file api.ts
 * @description Centralized types for API integration
 * Provides standardized types for API requests, responses, and error handling
 */

/**
 * Standard API response envelope
 */
export interface ApiResponse<T> {
  status: string;
  data: T;
  message?: string;
}

/**
 * Standard pagination parameters for requests
 */
export interface PaginationParams {
  page: number;
  limit: number;
}

/**
 * Standard response format for paginated data
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Standard API error response
 */
export interface ApiError {
  status: string;
  message: string;
  errors?: Record<string, string[]>;
  code?: string;
}

/**
 * Common filter parameters used across different endpoints
 */
export interface BaseFilterParams {
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Common date range filter parameters
 */
export interface DateRangeFilterParams {
  startDate?: string;
  endDate?: string;
}

/**
 * Authentication tokens response
 */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * Standard API sorting options
 */
export type SortOrder = 'asc' | 'desc';

/**
 * Common HTTP methods used in API calls
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/**
 * Storage keys for authentication tokens
 */
export const ACCESS_TOKEN_KEY = 'eventia_access_token';
export const REFRESH_TOKEN_KEY = 'eventia_refresh_token';

/**
 * Environment variable keys
 */
export const API_URL_KEY = 'VITE_API_URL';
export const WS_URL_KEY = 'VITE_WS_URL'; 