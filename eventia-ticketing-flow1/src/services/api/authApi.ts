/**
 * @service AdminAuthService
 * @description Service for handling admin authentication with the Express backend.
 * Provides methods for admin login, logout, and session management.
 * 
 * @apiEndpoints
 * - POST /auth/login - Authenticate an admin user and get access token
 * - POST /auth/logout - End the current admin session
 * - GET /auth/refresh - Refresh the admin access token
 */
import axios from 'axios';
import { API_URL, defaultApiClient } from './apiUtils';

// Types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin';
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  message?: string;
}

/**
 * Login an admin user with email and password
 * @param email Admin's email address
 * @param password Admin's password
 * @returns Promise with user data and access token
 */
export const login = async (email: string, password: string): Promise<AuthResponse> => {
  try {
    // Mock login for testing with dummy admin credentials
    if (email === 'admin@example.com' && password === 'password123') {
      console.log('Using mock admin login for testing');
      // Simulate API response delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return {
        user: {
          id: 'admin-0000',
          email: 'admin@example.com',
          name: 'Admin User',
          role: 'admin'
        },
        accessToken: 'mock_jwt_token_for_admin',
        message: 'Admin login successful (mock)'
      };
    }
    
    // Real API call
    const response = await defaultApiClient.post('/auth/login', {
      email,
      password
    });
    
    return response.data;
  } catch (error) {
    console.error('Admin login error:', error);
    throw error;
  }
};

/**
 * Logout the current admin user
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
 * Refresh the admin access token
 * @returns Promise with access token
 */
export const refreshToken = async (): Promise<AuthResponse> => {
  try {
    const response = await axios.get(`${API_URL}/auth/refresh`, {
      withCredentials: true
    });
    return response.data;
  } catch (error) {
    console.error('Token refresh error:', error);
    throw error;
  }
};

export default {
  login,
  logout,
  refreshToken
}; 