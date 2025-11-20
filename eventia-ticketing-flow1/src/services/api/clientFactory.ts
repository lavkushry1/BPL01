/**
 * @file clientFactory.ts
 * @description Factory for creating configured axios instances
 * Provides centralized configuration and interceptors for API clients
 */

import axios, { AxiosInstance } from 'axios';
import { API_BASE_URL } from '../../config';
import { ApiError } from './types';

// Define API URLs
export const API_URL = API_BASE_URL;
export const WS_URL = API_BASE_URL.replace(/^http/, 'ws');

/**
 * Log API error for debugging
 */
export const logApiError = (error: unknown): void => {
  if (import.meta.env.MODE !== 'production') {
    console.error('API Error:', error);
  }
};

/**
 * Standard error handler that formats errors for display
 */
export const handleApiError = (error: unknown): ApiError => {
  // If it's an AxiosError
  if (axios.isAxiosError(error)) {
    return {
      status: error.response?.status || 500,
      code: (error.response?.data as any)?.code || 'UNKNOWN_ERROR',
      message: (error.response?.data as any)?.message || error.message || 'An unknown error occurred',
      details: (error.response?.data as any)?.details || undefined
    };
  }

  // If it's an Error instance
  if (error instanceof Error) {
    return {
      status: 500,
      code: 'SERVER_ERROR',
      message: error.message || 'An unknown error occurred',
    };
  }

  // For anything else
  return {
    status: 500,
    code: 'SERVER_ERROR',
    message: 'An unknown error occurred',
  };
};

/**
 * Creates an API client with custom configuration
 */
export const createApiClient = (options: {
  baseURL?: string;
  timeout?: number;
  withCredentials?: boolean;
  headers?: Record<string, string>;
} = {}): AxiosInstance => {
  // Create Axios instance with provided options
  const instance = axios.create({
    baseURL: options.baseURL || API_URL,
    timeout: options.timeout || 30000,
    withCredentials: options.withCredentials !== undefined ? options.withCredentials : true,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers,
    },
  });

  // Add request interceptor
  instance.interceptors.request.use(
    (config) => {
      // Get auth token
      const token = localStorage.getItem('auth_token');

      // Add token to headers if available
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      return config;
    },
    (error) => Promise.reject(error)
  );

  // Add response interceptor
  instance.interceptors.response.use(
    (response) => response.data,
    (error) => {
      // Log the error
      logApiError(error);

      // Format and return the error
      return Promise.reject(handleApiError(error));
    }
  );

  return instance;
};

// Default API client instance
export const apiClient = createApiClient();
