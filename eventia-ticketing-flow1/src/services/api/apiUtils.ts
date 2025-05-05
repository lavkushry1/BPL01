import axios, { AxiosInstance, AxiosRequestConfig, AxiosError, AxiosResponse } from 'axios';
import { refreshToken } from './authApi';

// Get the API URL from environment variables - ensure correct port for backend
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

// Create a default API client instance with common configuration
export const defaultApiClient = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for cookies and authentication
});

// Add CSRF protection to requests
defaultApiClient.interceptors.request.use(request => {
  // Don't add CSRF token for GET requests or auth endpoints
  const isAuthEndpoint = request.url && (
    request.url.includes('/auth/login') || 
    request.url.includes('/auth/register') ||
    request.url.includes('/auth/refresh-token')
  );
  
  const needsCsrfProtection = 
    request.method !== 'GET' && 
    !isAuthEndpoint;
  
  if (needsCsrfProtection) {
    // Get CSRF token from session storage
    const csrfToken = sessionStorage.getItem('csrf_token');
    if (csrfToken && request.headers) {
      request.headers['X-CSRF-Token'] = csrfToken;
    }
  }
  
  return request;
});

// Improved request logging
defaultApiClient.interceptors.request.use(request => {
  const method = request.method?.toUpperCase() || 'UNKNOWN';
  const url = request.baseURL && request.url ? `${request.baseURL}${request.url}` : request.url || 'UNKNOWN';
  console.log(`API Request: [${method}] ${url}`, request.data ? 'with payload' : '');
  
  return request;
});

// Update the response interceptor for cookie-based auth
defaultApiClient.interceptors.response.use(
  response => {
    const status = response.status;
    const url = response.config.url || 'UNKNOWN';
    console.log(`API Response: [${status}] ${url}`, response.data ? 'with data' : '');
    
    return response;
  },
  async (error: AxiosError<ApiErrorResponse>) => {
    // Handle authentication errors
    if (error.response?.status === 401) {
      const originalRequest = error.config;
      
      // Only try to refresh once to prevent infinite loops
      if (!originalRequest || (originalRequest as any)._retry) {
        // Don't need to clear tokens from localStorage since we're using cookies
        // Redirect to login if already tried refreshing
        if (window.location.pathname !== '/login' && 
            window.location.pathname !== '/admin-login') {
          window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
        }
        return Promise.reject(error);
      }
      
      // Mark this request as retried
      (originalRequest as any)._retry = true;
      
      try {
        // Try to refresh the token using httpOnly cookie
        await refreshToken();
        
        // Retry the original request - the cookie will be sent automatically
        return defaultApiClient(originalRequest);
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        // Proceed with normal rejection if refresh fails
        if (window.location.pathname !== '/login' && 
            window.location.pathname !== '/admin-login') {
          window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
        }
      }
    }

    // Network errors handling (offline mode)
    if (!error.response && error.code === 'ERR_NETWORK') {
      console.error('Network error - offline mode activated');
      // Could dispatch to a store to show offline mode UI
    }

    // Log errors for debugging
    logApiError(error);

    return Promise.reject(error);
  }
);

// Configure WebSocket URL to match API_URL but with ws protocol
export const WS_URL = (import.meta.env.VITE_WS_URL || API_URL.replace(/^http/, 'ws'));

// Helper function to create authenticated API request headers
export const createAuthHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`
});

// Define the API base URL using the environment variable - ensure it's the same as API_URL
export const API_BASE_URL = API_URL;

// Storage keys for auth tokens - use the same keys as in authApi.ts
export const ACCESS_TOKEN_KEY = 'eventia_access_token';
export const REFRESH_TOKEN_KEY = 'eventia_refresh_token';

// Standard response interface
export interface ApiResponse<T> {
  status: string;
  data: T;
  message?: string;
}

// Pagination response interface
export interface PaginatedResponse<T> {
  status: string;
  data: {
    items: T[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}

// Error response interface
export interface ApiErrorResponse {
  status: string;
  message: string;
  errors?: Record<string, string[]>;
  code?: string;
}

/**
 * Create a configured Axios instance with standard headers and interceptors
 * @param config Additional axios configuration
 * @returns Axios instance
 */
export const createApiClient = (config?: AxiosRequestConfig): AxiosInstance => {
  const apiClient = axios.create({
    baseURL: API_URL,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    timeout: 30000, // 30 seconds
    ...config,
  });

  // Request interceptor to add auth token
  apiClient.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem(ACCESS_TOKEN_KEY);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor for standard error handling
  apiClient.interceptors.response.use(
    (response) => response,
    (error: AxiosError<ApiErrorResponse>) => {
      // Handle authentication errors
      if (error.response?.status === 401) {
        // Clear token and redirect to login if not already there
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        
        // Redirect to home page instead of login
        if (window.location.pathname !== '/') {
          window.location.href = '/';
        }
      }

      // Network errors handling (offline mode)
      if (!error.response && error.code === 'ERR_NETWORK') {
        console.error('Network error - offline mode activated');
        // Could dispatch to a store to show offline mode UI
      }

      // Log errors for debugging
      logApiError(error);

      return Promise.reject(error);
    }
  );

  return apiClient;
};

/**
 * Standardized error logging for API errors
 * @param error AxiosError object
 */
export const logApiError = (error: AxiosError<ApiErrorResponse>): void => {
  if (error.response) {
    // Server responded with error
    console.error('API Error:', {
      status: error.response.status,
      data: error.response.data,
      endpoint: error.config?.url,
      method: error.config?.method?.toUpperCase(),
    });
  } else if (error.request) {
    // Request made but no response
    console.error('API Error: No response received', {
      request: error.request,
      endpoint: error.config?.url,
      method: error.config?.method?.toUpperCase(),
    });
  } else {
    // Error setting up the request
    console.error('API Error:', error.message);
  }
};

/**
 * Default error handler for API calls
 * @param error AxiosError object
 * @returns Standardized error object with message
 */
export const handleApiError = (error: AxiosError<ApiErrorResponse>): { message: string; status?: number } => {
  // Default error message for unexpected errors
  let errorMessage = 'An unexpected error occurred. Please try again.';
  let statusCode = error.response?.status;

  if (error.response?.data?.message) {
    // Use server-provided error message if available
    errorMessage = error.response.data.message;
  } else if (error.code === 'ERR_NETWORK') {
    errorMessage = 'Network error. Please check your internet connection.';
  } else if (error.code === 'ECONNABORTED') {
    errorMessage = 'Request timed out. Please try again.';
  }

  return { message: errorMessage, status: statusCode };
};

/**
 * Format URL with query parameters
 * @param baseUrl The base endpoint URL
 * @param params Object with query parameters
 * @returns Formatted URL with query string
 */
export const formatUrlWithParams = (baseUrl: string, params?: Record<string, any>): string => {
  if (!params) return baseUrl;

  const queryParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      queryParams.append(key, value.toString());
    }
  });

  const queryString = queryParams.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
};

/**
 * Check if user is authenticated
 * @returns Boolean indicating if user has a token
 */
export const isAuthenticated = (): boolean => {
  return !!localStorage.getItem(ACCESS_TOKEN_KEY);
};

/**
 * Get authentication token
 * @returns Token string or null
 */
export const getAuthToken = (): string | null => {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
};

/**
 * Set authentication token
 * @param token JWT token
 */
export const setAuthToken = (token: string): void => {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
};

/**
 * Clear authentication token (logout)
 */
export const clearAuthToken = (): void => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

/**
 * Generate an API URL with the correct API prefix
 * @param endpoint The endpoint path (without leading slash)
 * @param params Optional URL parameters to replace in the path (e.g., :id)
 * @returns Full API URL
 */
export const getApiUrl = (endpoint: string, params?: Record<string, string>): string => {
  // Replace path parameters if provided
  let url = endpoint;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url = url.replace(`:${key}`, encodeURIComponent(value));
    });
  }

  // Make sure the endpoint doesn't already include the API URL or base path
  if (url.startsWith(API_URL) || url.startsWith('http://') || url.startsWith('https://')) {
    return url; // Already includes full URL
  }
  
  // Remove any leading slash and any duplicate /api/v1 prefixes
  url = url.replace(/^\//, '');
  if (url.startsWith('api/v1/')) {
    url = url.substring(7); // Remove 'api/v1/'
  }
  
  return url;
};

/**
 * Fetch a CSRF token from the server and store it for future requests
 * @returns Promise<string> The fetched CSRF token
 */
export const fetchCsrfToken = async (): Promise<string> => {
  try {
    // Make a GET request to any endpoint that supports CSRF generation
    const response = await defaultApiClient.get('/auth/csrf', { withCredentials: true });
    
    // Get token from response header
    const csrfToken = response.headers['x-csrf-token'];
    
    if (csrfToken) {
      // Store in sessionStorage for future requests
      sessionStorage.setItem('csrf_token', csrfToken.toString());
      return csrfToken.toString();
    }
    
    throw new Error('No CSRF token received from server');
  } catch (error) {
    console.error('Failed to fetch CSRF token:', error);
    return '';
  }
};

export default {
  API_BASE_URL,
  API_URL,
  createApiClient,
  defaultApiClient,
  handleApiError,
  logApiError,
  formatUrlWithParams,
  isAuthenticated,
  getAuthToken,
  setAuthToken,
  clearAuthToken,
  getApiUrl,
  WS_URL,
  createAuthHeaders,
  fetchCsrfToken,
};