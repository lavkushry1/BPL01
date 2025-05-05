/**
 * @file index.ts
 * @description Central export point for all API services
 * Provides unified access to all API service instances
 */

// Import and export from our files
import { apiClient, createApiClient, API_URL, WS_URL } from './clientFactory';
import { handleApiError, logApiError } from './errors';

// Export client factory and utilities
export { 
  apiClient, 
  createApiClient, 
  handleApiError,
  logApiError,
  API_URL,
  WS_URL
};

// Export types and helpers
export * from './types';
export * from './endpoints';

// Export service instances
import { eventService } from './eventService';
export { eventService };

// Legacy exports for backward compatibility
// These will be gradually replaced with the new service approach
import authApi from './authApi';
import bookingApi from './bookingApi';
import discountApi from './discountApi';
import paymentApi from './paymentApi';
import adminApi from './adminApi';
import seatMapApi from './seatMapApi';
import userApi from './userApi';
import ticketApi from './ticketApi';

// Export legacy API modules
export {
  authApi,
  bookingApi,
  discountApi,
  paymentApi,
  adminApi,
  seatMapApi,
  userApi,
  ticketApi
};

// Default export to maintain compatibility
const api = {
  auth: authApi,
  booking: bookingApi,
  discount: discountApi,
  payment: paymentApi,
  admin: adminApi,
  seatMap: seatMapApi,
  user: userApi,
  ticket: ticketApi,
  event: eventService
};

// Export the main API client instance
export default api;

// Create a default axios client for direct use
import axios from 'axios';
import { API_BASE_URL } from '../../config';

// Create a default API client instance using axios
export const defaultApiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include authorization headers
defaultApiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// API Services built on the defaultApiClient
export const apiServices = {
  // Auth
  login: (email: string, password: string) => 
    defaultApiClient.post('/auth/login', { email, password }),
  
  register: (userData: any) => 
    defaultApiClient.post('/auth/register', userData),
  
  forgotPassword: (email: string) => 
    defaultApiClient.post('/auth/forgot-password', { email }),
  
  resetPassword: (token: string, password: string) => 
    defaultApiClient.post('/auth/reset-password', { token, password }),
  
  // Events
  getEvents: (params?: any) => 
    defaultApiClient.get('/events', { params }),
  
  getEvent: (id: string) => 
    defaultApiClient.get(`/events/${id}`),
  
  // Bookings
  createBooking: (bookingData: any) => 
    defaultApiClient.post('/bookings', bookingData),
  
  getBookings: () => 
    defaultApiClient.get('/bookings'),
  
  getBooking: (id: string) => 
    defaultApiClient.get(`/bookings/${id}`),
  
  // Payments
  initiatePayment: (paymentData: any) => 
    defaultApiClient.post('/payments/initiate', paymentData),
  
  verifyPayment: (paymentId: string) => 
    defaultApiClient.post(`/payments/verify/${paymentId}`),
}; 