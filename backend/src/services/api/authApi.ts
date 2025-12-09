import { defaultApiClient, handleApiError, handleApiResponse } from './apiUtils';

export interface AuthResponse {
  token: string;
  refreshToken?: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

/**
 * Login with email and password
 */
export const login = async (email: string, password: string): Promise<AuthResponse> => {
  try {
    const response = await defaultApiClient.post('/auth/login', { email, password });
    return handleApiResponse<AuthResponse>(response);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Register a new user
 */
export const register = async (email: string, password: string, name: string): Promise<AuthResponse> => {
  try {
    const response = await defaultApiClient.post('/auth/register', { email, password, name });
    return handleApiResponse<AuthResponse>(response);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Logout the current user
 */
export const logout = async (): Promise<void> => {
  try {
    await defaultApiClient.post('/auth/logout');
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Get the currently authenticated user
 */
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const response = await defaultApiClient.get('/auth/me');
    return handleApiResponse<User>(response);
  } catch (error) {
    return null;
  }
};

/**
 * Refresh the authentication token
 */
export const refreshToken = async (): Promise<AuthResponse | null> => {
  try {
    const response = await defaultApiClient.post('/auth/refresh');
    return handleApiResponse<AuthResponse>(response);
  } catch (error) {
    return null;
  }
};
