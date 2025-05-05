/**
 * @service AuthService
 * @description Service for handling user authentication with the Express backend.
 * Provides methods for user registration, login, logout, and session management.
 * 
 * @apiEndpoints
 * - POST /api/v1/auth/register - Register a new user
 * - POST /api/v1/auth/login - Authenticate a user and get access token
 * - POST /api/v1/auth/logout - End the current user session
 * - GET /api/v1/auth/me - Get current user data
 * - POST /api/v1/auth/refresh-token - Refresh the user access token
 */
import { defaultApiClient } from './apiUtils';

// Types
export interface User {
  id: string;
  email: string;
  name: string;
  role: string; // Changed from 'admin' to string to support 'USER', 'ADMIN', etc.
  verified?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthResponse {
  user: User;
  token?: string; // Access token - only returned in development
  refreshToken?: string; // Only returned in development
  message?: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role?: string;
}

/**
 * Register a new user
 * @param userData User registration data
 * @returns Promise with registered user data
 */
export const register = async (userData: RegisterData): Promise<any> => {
  try {
    const response = await defaultApiClient.post('/auth/register', userData);
    return response.data;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

/**
 * Login a user with email and password
 * @param email User's email address
 * @param password User's password
 * @returns Promise with user data
 */
export const login = async (email: string, password: string): Promise<AuthResponse> => {
  try {
    // Use the standardized API client with credentials
    const response = await defaultApiClient.post('/auth/login', {
      email,
      password
    }, { withCredentials: true });
    
    // Response will now contain user data but not tokens (they're in HttpOnly cookies)
    return response.data.data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

/**
 * Logout the current user
 * @returns Promise with logout status
 */
export const logout = async (): Promise<{ success: boolean; message: string }> => {
  try {
    // Call logout endpoint with credentials to clear cookies
    const response = await defaultApiClient.post('/auth/logout', {}, { withCredentials: true });
    return response.data;
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
};

/**
 * Refresh the user access token using the HttpOnly refresh token cookie
 * @returns Promise with success status
 */
export const refreshToken = async (): Promise<{ success: boolean }> => {
  try {
    // Call refresh endpoint with cookies
    await defaultApiClient.post('/auth/refresh-token', {}, { withCredentials: true });
    return { success: true };
  } catch (error) {
    console.error('Token refresh error:', error);
    throw error;
  }
};

/**
 * Get current user data
 * @returns Promise with current user data
 */
export const getCurrentUser = async (): Promise<User> => {
  try {
    const response = await defaultApiClient.get('/auth/me', { withCredentials: true });
    return response.data.data;
  } catch (error) {
    console.error('Get current user error:', error);
    throw error;
  }
};

export default {
  register,
  login,
  logout,
  refreshToken,
  getCurrentUser
}; 