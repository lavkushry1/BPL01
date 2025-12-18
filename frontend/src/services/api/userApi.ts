import { defaultApiClient } from './apiUtils';
import { unwrapApiResponse } from './responseUtils';

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

// Define interface for user profile with address
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };
  role: string;
  verified?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Define interface for profile update request
export interface ProfileUpdateRequest {
  name?: string;
  phone?: string;
  address?: {
    line1?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };
}

const apiClient = defaultApiClient;

// UserApi service
const userApi = {
  /**
   * Register a new user
   * @param data Registration data
   */
  register: (data: RegisterRequest) => {
    return apiClient.post<AuthResponse>('/auth/register', data).then(unwrapApiResponse);
  },

  /**
   * Login with email and password
   * @param data Login credentials
   */
  login: (data: LoginRequest) => {
    return apiClient.post<AuthResponse>('/auth/login', data).then(unwrapApiResponse);
  },

  /**
   * Logout current user
   */
  logout: () => {
    return apiClient.post('/auth/logout').then(unwrapApiResponse);
  },

  /**
   * Get current user profile
   */
  getCurrentUser: () => {
    return apiClient.get<UserResponse>('/users/profile').then(unwrapApiResponse);
  },

  /**
   * Update user profile
   * @param data Profile data to update
   */
  updateProfile: (data: UpdateProfileRequest) => {
    return apiClient.patch<UserResponse>('/users/profile', data).then(unwrapApiResponse);
  },

  /**
   * Change user password
   * @param data Password change data
   */
  changePassword: (data: ChangePasswordRequest) => {
    return apiClient.post('/users/profile/change-password', data).then(unwrapApiResponse);
  },

  /**
   * Request password reset
   * @param data Password reset request data
   */
  requestPasswordReset: (data: ResetPasswordRequest) => {
    return apiClient.post('/auth/forgot-password', data).then(unwrapApiResponse);
  },

  /**
   * Reset password with token
   * @param token Reset token
   * @param password New password
   */
  resetPassword: (token: string, password: string) => {
    return apiClient.post('/auth/reset-password', { token, password }).then(unwrapApiResponse);
  },

  /**
   * Verify email with token
   * @param token Verification token
   */
  verifyEmail: (token: string) => {
    return apiClient.post('/auth/verify-email', { token }).then(unwrapApiResponse);
  },

  /**
   * Resend verification email
   */
  resendVerificationEmail: () => {
    return apiClient.post('/auth/resend-verification').then(unwrapApiResponse);
  },

  /**
   * Get user addresses
   */
  getUserAddresses: () => {
    return apiClient.get<AddressesResponse>('/users/profile/addresses').then(unwrapApiResponse);
  },

  /**
   * Add new user address
   * @param address Address data
   */
  addUserAddress: (address: Omit<Address, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    return apiClient.post<AddressResponse>('/users/profile/addresses', address).then(unwrapApiResponse);
  },

  /**
   * Update user address
   * @param addressId Address ID
   * @param address Address data to update
   */
  updateUserAddress: (addressId: string, address: Partial<Omit<Address, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => {
    return apiClient.patch<AddressResponse>(`/users/profile/addresses/${addressId}`, address).then(unwrapApiResponse);
  },

  /**
   * Delete user address
   * @param addressId Address ID
   */
  deleteUserAddress: (addressId: string) => {
    return apiClient.delete(`/users/profile/addresses/${addressId}`).then(unwrapApiResponse);
  },

  /**
   * Set default address
   * @param addressId Address ID
   */
  setDefaultAddress: (addressId: string) => {
    return apiClient.post<AddressResponse>(`/users/profile/addresses/${addressId}/set-default`).then(unwrapApiResponse);
  },

  /**
   * Update user preferences
   * @param preferences User preferences
   */
  updatePreferences: (preferences: Partial<UserPreferences>) => {
    return apiClient.patch<UserResponse>('/users/profile/preferences', { preferences }).then(unwrapApiResponse);
  },

  /**
   * Get user profile with detailed information
   * @returns Promise with user profile data
   */
  getUserProfile: async (): Promise<UserProfile> => {
    try {
      const response = await apiClient.get<{ status: string; data: UserProfile }>('/users/profile');
      return unwrapApiResponse<UserProfile>(response);
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      throw error;
    }
  },

  /**
   * Update user profile
   * @param data Profile data to update
   * @returns Updated user profile
   */
  updateUserProfileDetails: async (data: ProfileUpdateRequest): Promise<UserProfile> => {
    try {
      const response = await apiClient.patch<{ status: string; data: UserProfile }>('/users/profile', data);
      return unwrapApiResponse<UserProfile>(response);
    } catch (error) {
      console.error('Failed to update user profile:', error);
      throw error;
    }
  }
};

export default userApi;
