/**
 * @service AdminApiService
 * @description Service for handling admin-specific API requests
 * All endpoints are protected by authentication middleware on the server
 * 
 * @apiEndpoints
 * - GET /admin/stats - Get dashboard statistics
 * - GET/POST/PUT/DELETE /admin/users - Manage users
 * - GET/POST/PUT/DELETE /admin/deliveries - Manage deliveries
 * - GET/POST/PUT/DELETE /admin/events - Manage events
 * - GET/POST /admin/payments/approve - Approve payments
 */
import { defaultApiClient } from './apiUtils';
import axios from 'axios';
import { API_BASE_URL } from '@/config';

// Types
export interface AdminStats {
  totalUsers: number;
  activeEvents: number;
  pendingDeliveries: number;
  revenue: number;
  recentActivity: Array<{
    id: string;
    type: 'booking' | 'user' | 'event' | 'payment';
    message: string;
    timestamp: string;
  }>;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  isActive: boolean;
  created_at: string;
}

export interface Delivery {
  id: string;
  orderId: string;
  customerName: string;
  address: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered';
  trackingNumber?: string;
  created_at: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  venue: string;
  ticketPrice: number;
  availableTickets: number;
  isActive: boolean;
}

export interface Payment {
  id: string;
  orderId: string;
  customerName: string;
  amount: number;
  paymentMethod: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

/**
 * Get dashboard statistics
 * @returns Promise with admin dashboard statistics
 */
export const getStats = async (): Promise<AdminStats> => {
  try {
    const response = await defaultApiClient.get('/admin/stats');
    return response.data;
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    throw error;
  }
};

/**
 * Get all users
 * @returns Promise with list of users
 */
export const getUsers = async (): Promise<User[]> => {
  try {
    // Uncomment for production use
    // const response = await axios.get(`${API_BASE_URL}/admin/users`);
    // return response.data;
    
    // For development/testing, return mock data
    return [
      { 
        id: '1', 
        name: 'John Doe', 
        email: 'john@example.com', 
        role: 'admin', 
        isActive: true, 
        created_at: '2023-04-15' 
      },
      { 
        id: '2', 
        name: 'Jane Smith', 
        email: 'jane@example.com', 
        role: 'user', 
        isActive: true, 
        created_at: '2023-05-21' 
      },
      { 
        id: '3', 
        name: 'Robert Johnson', 
        email: 'robert@example.com', 
        role: 'user', 
        isActive: false, 
        created_at: '2023-06-03' 
      },
      { 
        id: '4', 
        name: 'Emma Wilson', 
        email: 'emma@example.com', 
        role: 'user', 
        isActive: true, 
        created_at: '2023-06-10' 
      },
      { 
        id: '5', 
        name: 'Admin User', 
        email: 'admin@example.com', 
        role: 'admin', 
        isActive: true, 
        created_at: '2023-01-01' 
      }
    ];
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

/**
 * Create a new user
 * @param userData User data to create
 * @returns Promise with created user
 */
export const createUser = async (userData: Omit<User, 'id' | 'created_at'>): Promise<User> => {
  try {
    const response = await defaultApiClient.post('/admin/users', userData);
    return response.data;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

/**
 * Update a user
 * @param id User ID
 * @param userData Updated user data
 * @returns Promise with updated user
 */
export const updateUser = async (id: string, userData: Partial<User>): Promise<User> => {
  try {
    const response = await defaultApiClient.put(`/admin/users/${id}`, userData);
    return response.data;
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

/**
 * Delete a user
 * @param id User ID
 * @returns Promise with success message
 */
export const deleteUser = async (id: string): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await defaultApiClient.delete(`/admin/users/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};

/**
 * Get all deliveries
 * @returns Promise with list of deliveries
 */
export const getDeliveries = async (): Promise<Delivery[]> => {
  try {
    const response = await defaultApiClient.get('/admin/deliveries');
    return response.data;
  } catch (error) {
    console.error('Error fetching deliveries:', error);
    throw error;
  }
};

/**
 * Create a new delivery
 * @param deliveryData Delivery data to create
 * @returns Promise with created delivery
 */
export const createDelivery = async (deliveryData: Omit<Delivery, 'id' | 'created_at'>): Promise<Delivery> => {
  try {
    const response = await defaultApiClient.post('/admin/deliveries', deliveryData);
    return response.data;
  } catch (error) {
    console.error('Error creating delivery:', error);
    throw error;
  }
};

/**
 * Update a delivery
 * @param id Delivery ID
 * @param deliveryData Updated delivery data
 * @returns Promise with updated delivery
 */
export const updateDelivery = async (id: string, deliveryData: Partial<Delivery>): Promise<Delivery> => {
  try {
    const response = await defaultApiClient.put(`/admin/deliveries/${id}`, deliveryData);
    return response.data;
  } catch (error) {
    console.error('Error updating delivery:', error);
    throw error;
  }
};

/**
 * Delete a delivery
 * @param id Delivery ID
 * @returns Promise with success message
 */
export const deleteDelivery = async (id: string): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await defaultApiClient.delete(`/admin/deliveries/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting delivery:', error);
    throw error;
  }
};

/**
 * Get all events
 * @returns Promise with list of events
 */
export const getEvents = async (): Promise<Event[]> => {
  try {
    const response = await defaultApiClient.get('/admin/events');
    return response.data;
  } catch (error) {
    console.error('Error fetching events:', error);
    throw error;
  }
};

/**
 * Create a new event
 * @param eventData Event data to create
 * @returns Promise with created event
 */
export const createEvent = async (eventData: Omit<Event, 'id'>): Promise<Event> => {
  try {
    const response = await defaultApiClient.post('/admin/events', eventData);
    return response.data;
  } catch (error) {
    console.error('Error creating event:', error);
    throw error;
  }
};

/**
 * Update an event
 * @param id Event ID
 * @param eventData Updated event data
 * @returns Promise with updated event
 */
export const updateEvent = async (id: string, eventData: Partial<Event>): Promise<Event> => {
  try {
    const response = await defaultApiClient.put(`/admin/events/${id}`, eventData);
    return response.data;
  } catch (error) {
    console.error('Error updating event:', error);
    throw error;
  }
};

/**
 * Delete an event
 * @param id Event ID
 * @returns Promise with success message
 */
export const deleteEvent = async (id: string): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await defaultApiClient.delete(`/admin/events/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting event:', error);
    throw error;
  }
};

/**
 * Get pending payments
 * @returns Promise with list of pending payments
 */
export const getPendingPayments = async (): Promise<Payment[]> => {
  try {
    const response = await defaultApiClient.get('/admin/payments');
    return response.data;
  } catch (error) {
    console.error('Error fetching payments:', error);
    throw error;
  }
};

/**
 * Approve a payment
 * @param id Payment ID
 * @returns Promise with approved payment
 */
export const approvePayment = async (id: string): Promise<Payment> => {
  try {
    const response = await defaultApiClient.post(`/admin/payments/${id}/approve`);
    return response.data;
  } catch (error) {
    console.error('Error approving payment:', error);
    throw error;
  }
};

/**
 * Reject a payment
 * @param id Payment ID
 * @param reason Reason for rejection
 * @returns Promise with rejected payment
 */
export const rejectPayment = async (id: string, reason: string): Promise<Payment> => {
  try {
    const response = await defaultApiClient.post(`/admin/payments/${id}/reject`, { reason });
    return response.data;
  } catch (error) {
    console.error('Error rejecting payment:', error);
    throw error;
  }
};

export const updateUserRole = async (userId: string, role: 'admin' | 'user') => {
  try {
    // Uncomment for production use
    // const response = await axios.put(`${API_BASE_URL}/admin/users/${userId}/role`, { role });
    // return response.data;
    
    // For development/testing, just log the action
    console.log(`Updated user ${userId} role to ${role}`);
    return { success: true };
  } catch (error) {
    console.error('Error updating user role:', error);
    throw error;
  }
};

export const updateUserStatus = async (userId: string, isActive: boolean) => {
  try {
    // Uncomment for production use
    // const response = await axios.put(`${API_BASE_URL}/admin/users/${userId}/status`, { isActive });
    // return response.data;
    
    // For development/testing, just log the action
    console.log(`Updated user ${userId} status to ${isActive ? 'active' : 'inactive'}`);
    return { success: true };
  } catch (error) {
    console.error('Error updating user status:', error);
    throw error;
  }
};

export default {
  getStats,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  getDeliveries,
  createDelivery,
  updateDelivery,
  deleteDelivery,
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  getPendingPayments,
  approvePayment,
  rejectPayment,
  updateUserRole,
  updateUserStatus
}; 