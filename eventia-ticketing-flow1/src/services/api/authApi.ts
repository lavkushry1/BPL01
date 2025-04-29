/**
 * @service AuthApiService
 * @description Service for handling authentication with the Express backend.
 * Provides methods for user login, registration, password reset, and session management.
 * Uses HTTP-only cookies for refresh tokens and in-memory access tokens for better security.
 * 
 * @apiEndpoints
 * - POST /api/auth/login - Authenticate a user and get access token (refresh token in HTTP-only cookie)
 * - POST /api/auth/register - Register a new user
 * - POST /api/auth/logout - End the current session by invalidating refresh token
 * - GET /api/auth/refresh - Refresh the access token using HTTP-only cookie
 * - POST /api/auth/forgot-password - Initiate password reset
 * - POST /api/auth/reset-password - Complete password reset
 * - GET /api/auth/me - Get the current user's profile
 * 
 * @securityConsiderations
 * - Refresh tokens are stored in HTTP-only cookies for XSS protection
 * - Access tokens are short-lived and stored in memory only
 * - Uses withCredentials: true for requests that need cookies
 */
import axios from 'axios';
import { API_URL, defaultApiClient } from './apiUtils';

// Types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  message?: string;
}

/**
 * Login a user with email and password
 * @param email User's email address
 * @param password User's password
 * @returns Promise with user data and access token
 */
export const login = async (email: string, password: string): Promise<AuthResponse> => {
  try {
    const response = await defaultApiClient.post('/auth/login', {
      email,
      password
    });
    
    return response.data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

/**
 * Register a new user
 * @param email User's email address
 * @param password User's password
 * @param name User's name
 * @returns Promise with user data and access token
 */
export const register = async (
  email: string, 
  password: string, 
  name: string
): Promise<AuthResponse> => {
  try {
    const response = await defaultApiClient.post('/auth/register', {
      email,
      password,
      name
    });
    
    return response.data;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

/**
 * Logout the current user
 * @returns Promise with logout status
 */
export const logout = async (): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await defaultApiClient.post('/auth/logout');
    return response.data;
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
};

/**
 * Get the current user's profile
 * @returns Promise with user data
 */
export const getCurrentUser = async (): Promise<User> => {
  try {
    const response = await defaultApiClient.get('/auth/me');
    return response.data.user;
  } catch (error) {
    console.error('Get current user error:', error);
    throw error;
  }
};

/**
 * Refresh the access token using the refresh token in HTTP-only cookie
 * @returns Promise with access token
 */
export const refreshToken = async (): Promise<AuthResponse> => {
  try {
    // Use axios directly instead of defaultApiClient to avoid adding Authorization header
    const response = await axios.get(`${API_URL}/auth/refresh`, {
      withCredentials: true // Important for cookies
    });
    return response.data;
  } catch (error) {
    console.error('Token refresh error:', error);
    throw error;
  }
};

/**
 * Initiate password reset
 * @param email User's email address
 * @returns Promise with status message
 */
export const forgotPassword = async (email: string): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await defaultApiClient.post('/auth/forgot-password', { email });
    return response.data;
  } catch (error) {
    console.error('Forgot password error:', error);
    throw error;
  }
};

/**
 * Complete password reset
 * @param token Reset token from email
 * @param password New password
 * @returns Promise with status message
 */
export const resetPassword = async (token: string, password: string): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await defaultApiClient.post('/auth/reset-password', {
      token,
      password
    });
    return response.data;
  } catch (error) {
    console.error('Reset password error:', error);
    throw error;
  }
};

export default {
  login,
  register,
  logout,
  getCurrentUser,
  refreshToken,
  forgotPassword,
  resetPassword
}; 