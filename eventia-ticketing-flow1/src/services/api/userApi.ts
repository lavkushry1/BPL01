import axios from 'axios';

// Define the API base URL using import.meta.env for Vite compatibility
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

// Define interfaces for user data
export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  profile_image_url?: string;
  role: 'admin' | 'organizer' | 'customer';
  is_verified: boolean;
  is_active: boolean;
  preferences?: UserPreferences;
  created_at: string;
  updated_at: string;
}

export interface UserPreferences {
  email_notifications: boolean;
  marketing_emails: boolean;
  sms_notifications: boolean;
  language: string;
  currency: string;
  timezone: string;
}

export interface Address {
  id: string;
  user_id: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state?: string;
  postal_code: string;
  country: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
}

export interface ResetPasswordRequest {
  email: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

export interface UpdateProfileRequest {
  first_name?: string;
  last_name?: string;
  phone?: string;
  profile_image_url?: string;
  preferences?: Partial<UserPreferences>;
}

export interface AuthResponse {
  status: string;
  data: {
    user: User;
    token: string;
    expires_at: string;
  };
}

export interface UserResponse {
  status: string;
  data: User;
}

export interface AddressesResponse {
  status: string;
  data: Address[];
}

export interface AddressResponse {
  status: string;
  data: Address;
}

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token if available
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// UserApi service
const userApi = {
  /**
   * Register a new user
   * @param data Registration data
   */
  register: (data: RegisterRequest) => {
    return apiClient.post<AuthResponse>('/api/auth/register', data);
  },

  /**
   * Login with email and password
   * @param data Login credentials
   */
  login: (data: LoginRequest) => {
    return apiClient.post<AuthResponse>('/api/auth/login', data);
  },

  /**
   * Logout current user
   */
  logout: () => {
    return apiClient.post('/api/auth/logout');
  },

  /**
   * Get current user profile
   */
  getCurrentUser: () => {
    return apiClient.get<UserResponse>('/api/users/me');
  },

  /**
   * Update user profile
   * @param data Profile data to update
   */
  updateProfile: (data: UpdateProfileRequest) => {
    return apiClient.patch<UserResponse>('/api/users/me', data);
  },

  /**
   * Change user password
   * @param data Password change data
   */
  changePassword: (data: ChangePasswordRequest) => {
    return apiClient.post('/api/users/me/change-password', data);
  },

  /**
   * Request password reset
   * @param data Password reset request data
   */
  requestPasswordReset: (data: ResetPasswordRequest) => {
    return apiClient.post('/api/auth/forgot-password', data);
  },

  /**
   * Reset password with token
   * @param token Reset token
   * @param password New password
   */
  resetPassword: (token: string, password: string) => {
    return apiClient.post('/api/auth/reset-password', { token, password });
  },

  /**
   * Verify email with token
   * @param token Verification token
   */
  verifyEmail: (token: string) => {
    return apiClient.post('/api/auth/verify-email', { token });
  },

  /**
   * Resend verification email
   */
  resendVerificationEmail: () => {
    return apiClient.post('/api/auth/resend-verification');
  },

  /**
   * Get user addresses
   */
  getUserAddresses: () => {
    return apiClient.get<AddressesResponse>('/api/users/me/addresses');
  },

  /**
   * Add new user address
   * @param address Address data
   */
  addUserAddress: (address: Omit<Address, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    return apiClient.post<AddressResponse>('/api/users/me/addresses', address);
  },

  /**
   * Update user address
   * @param addressId Address ID
   * @param address Address data to update
   */
  updateUserAddress: (addressId: string, address: Partial<Omit<Address, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => {
    return apiClient.patch<AddressResponse>(`/api/users/me/addresses/${addressId}`, address);
  },

  /**
   * Delete user address
   * @param addressId Address ID
   */
  deleteUserAddress: (addressId: string) => {
    return apiClient.delete(`/api/users/me/addresses/${addressId}`);
  },

  /**
   * Set default address
   * @param addressId Address ID
   */
  setDefaultAddress: (addressId: string) => {
    return apiClient.post<AddressResponse>(`/api/users/me/addresses/${addressId}/set-default`);
  },

  /**
   * Update user preferences
   * @param preferences User preferences
   */
  updatePreferences: (preferences: Partial<UserPreferences>) => {
    return apiClient.patch<UserResponse>('/api/users/me/preferences', { preferences });
  }
};

export default userApi; 