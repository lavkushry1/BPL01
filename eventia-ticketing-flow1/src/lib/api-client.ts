import axios, { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { toast } from '@/hooks/use-toast';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds
});

// Request interceptor for adding auth token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('auth_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor for global error handling
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    const statusCode = error.response?.status;
    const responseData = error.response?.data as any;
    
    // Handle authentication errors
    if (statusCode === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
      toast({
        title: 'Session expired',
        description: 'Please log in again to continue.',
        variant: 'destructive',
      });
    }
    
    // Handle server errors
    else if (statusCode && statusCode >= 500) {
      toast({
        title: 'Server error',
        description: 'Something went wrong. Please try again later.',
        variant: 'destructive',
      });
    }
    
    // Handle validation errors (400 range)
    else if (statusCode && statusCode >= 400 && statusCode < 500) {
      const errorMessage = responseData?.message || 'Request failed. Please check your data and try again.';
      if (!error.config?.headers?.['suppress-error-toast']) {
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;

// Helper types for API responses
export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: string;
}

export interface ApiError {
  message: string;
  code?: string;
  errors?: Record<string, string[]>;
}

// Helper functions
export const handleApiError = (error: unknown): ApiError => {
  if (axios.isAxiosError(error) && error.response?.data) {
    return error.response.data as ApiError;
  }
  return { 
    message: error instanceof Error ? error.message : 'An unknown error occurred' 
  };
}; 