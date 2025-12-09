/**
 * API Client implementation
 */
import axios, { AxiosInstance, AxiosRequestConfig, AxiosError, AxiosResponse } from 'axios';
import { API_BASE_URL } from '../../config';
import { ApiResponse, ApiError, RequestOptions } from './types';

// Create the default axios instance
const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    // Get the token from localStorage
    const token = localStorage.getItem('auth_token');
    
    // If token exists, add it to the request headers
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => response.data,
  (error: AxiosError) => {
    // Create standardized error object
    const apiError: ApiError = {
      status: error.response?.status || 500,
      code: (error.response?.data as any)?.code || 'UNKNOWN_ERROR',
      message: (error.response?.data as any)?.message || error.message || 'An unknown error occurred',
      details: (error.response?.data as any)?.details || undefined
    };
    
    return Promise.reject(apiError);
  }
);

// API client implementation
export const apiClient = {
  /**
   * Performs a GET request
   */
  get: async <T>(url: string, options?: RequestOptions): Promise<T> => {
    const config: AxiosRequestConfig = {
      ...options,
    };
    return axiosInstance.get<any, T>(url, config);
  },
  
  /**
   * Performs a POST request
   */
  post: async <T>(url: string, data: any, options?: RequestOptions): Promise<T> => {
    const config: AxiosRequestConfig = {
      ...options,
    };
    return axiosInstance.post<any, T>(url, data, config);
  },
  
  /**
   * Performs a PUT request
   */
  put: async <T>(url: string, data: any, options?: RequestOptions): Promise<T> => {
    const config: AxiosRequestConfig = {
      ...options,
    };
    return axiosInstance.put<any, T>(url, data, config);
  },
  
  /**
   * Performs a PATCH request
   */
  patch: async <T>(url: string, data: any, options?: RequestOptions): Promise<T> => {
    const config: AxiosRequestConfig = {
      ...options,
    };
    return axiosInstance.patch<any, T>(url, data, config);
  },
  
  /**
   * Performs a DELETE request
   */
  delete: async <T>(url: string, options?: RequestOptions): Promise<T> => {
    const config: AxiosRequestConfig = {
      ...options,
    };
    return axiosInstance.delete<any, T>(url, config);
  }
}; 