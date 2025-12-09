/**
 * API Endpoints
 * Centralizes all API endpoint paths
 */

// API version
export const API_VERSION = 'v1';

// Root endpoints
export const ENDPOINTS = {
  // Auth related endpoints
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH_TOKEN: '/auth/refresh-token',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    VERIFY_EMAIL: '/auth/verify-email',
    ME: '/auth/me',
  },
  
  // User related endpoints
  USER: {
    BASE: '/users',
    PROFILE: '/users/profile',
    PREFERENCES: '/users/preferences',
    CHANGE_PASSWORD: '/users/change-password',
    NOTIFICATIONS: '/users/notifications',
  },
  
  // Event related endpoints
  EVENT: {
    BASE: '/events',
    FEATURED: '/events/featured',
    CATEGORIES: '/events/categories',
    SEARCH: '/events/search',
    UPCOMING: '/events/upcoming',
  },
  
  // Ticket related endpoints
  TICKET: {
    BASE: '/tickets',
    TYPES: '/tickets/types',
    VALIDATE: '/tickets/validate',
    SCAN: '/tickets/scan',
  },
  
  // Booking related endpoints
  BOOKING: {
    BASE: '/bookings',
    HISTORY: '/bookings/history',
    CANCEL: '/bookings/cancel',
  },
  
  // Payment related endpoints
  PAYMENT: {
    BASE: '/payments',
    METHODS: '/payments/methods',
    INITIATE: '/payments/initiate',
    VERIFY: '/payments/verify',
    REFUND: '/payments/refund',
  },
  
  // Admin related endpoints
  ADMIN: {
    BASE: '/admin',
    DASHBOARD: '/admin/dashboard',
    USERS: '/admin/users',
    EVENTS: '/admin/events',
    BOOKINGS: '/admin/bookings',
    REPORTS: '/admin/reports',
    SETTINGS: '/admin/settings',
  },
  
  // Venue related endpoints
  VENUE: {
    BASE: '/venues',
    SEARCH: '/venues/search',
    SEAT_MAPS: '/venues/seat-maps',
  },
  
  // Discount related endpoints
  DISCOUNT: {
    BASE: '/discounts',
    VALIDATE: '/discounts/validate',
    APPLY: '/discounts/apply',
  },
}; 