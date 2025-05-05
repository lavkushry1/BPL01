import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ErrorCode } from '../../utils/errorCodes';

// Define API response and error types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    details?: any;
  };
  data: null;
}

// Create an Axios instance with defaults
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Error logging service
export const logError = (error: unknown, context?: Record<string, any>) => {
  // In development, log to console
  if (import.meta.env.DEV) {
    console.error('API Error:', error);
    if (context) console.error('Context:', context);
    return;
  }
  
  // In production, send to monitoring service or custom endpoint
  // This could be expanded to use a service like Sentry
  try {
    // For now, just log to console in production
    console.error('API Error:', error);
  } catch (e) {
    // Silently fail if error logging fails
  }
};

// Add a request interceptor for authentication
apiClient.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('accessToken');
    
    // If token exists, add to headers
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Get CSRF token from cookies
    const csrfToken = document.cookie
      .split('; ')
      .find(row => row.startsWith('XSRF-TOKEN='))
      ?.split('=')[1];
      
    if (csrfToken) {
      config.headers['X-XSRF-TOKEN'] = csrfToken;
    }
    
    return config;
  },
  (error) => {
    logError(error, { type: 'request_error' });
    return Promise.reject(error);
  }
);

// Add a response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError<ApiErrorResponse>) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
    
    // Handle network errors
    if (!error.response) {
      const networkError: ApiErrorResponse = {
        success: false,
        error: {
          code: ErrorCode.NETWORK_ERROR,
          message: 'Network error. Please check your connection.',
        },
        data: null
      };
      
      logError(error, { 
        type: 'network_error',
        url: originalRequest?.url
      });
      
      return Promise.reject(networkError);
    }
    
    // Handle 401 Unauthorized errors - attempt token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh the token
        const refreshToken = localStorage.getItem('refreshToken');
        
        if (refreshToken) {
          const response = await axios.post(
            `${import.meta.env.VITE_API_BASE_URL || '/api'}/auth/refresh-token`,
            { refreshToken }
          );
          
          const { accessToken } = response.data;
          
          // Store the new token
          localStorage.setItem('accessToken', accessToken);
          
          // Update the original request with the new token
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          } else {
            originalRequest.headers = { Authorization: `Bearer ${accessToken}` };
          }
          
          // Retry the original request
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // If refresh fails, redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        
        logError(refreshError, { 
          type: 'token_refresh_error',
          originalStatus: error.response?.status
        });
        
        // Only redirect if we're in the browser environment
        if (typeof window !== 'undefined') {
          window.location.href = '/login?reason=session_expired';
        }
      }
    }
    
    // Log the error with context
    logError(error, {
      url: originalRequest?.url,
      status: error.response?.status,
      data: error.response?.data,
      method: originalRequest?.method
    });
    
    // Return a standardized error object
    return Promise.reject(error.response?.data || {
      success: false,
      error: {
        code: ErrorCode.INTERNAL_ERROR,
        message: error.message || 'An unexpected error occurred'
      },
      data: null
    });
  }
);

// Helper methods
export const api = {
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await apiClient.get<ApiResponse<T>>(url, config);
    return response.data.data;
  },
  
  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await apiClient.post<ApiResponse<T>>(url, data, config);
    return response.data.data;
  },
  
  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await apiClient.put<ApiResponse<T>>(url, data, config);
    return response.data.data;
  },
  
  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await apiClient.delete<ApiResponse<T>>(url, config);
    return response.data.data;
  }
};

export default apiClient; 