import axios from 'axios';
import { API_BASE_URL } from './apiUtils';

// Define interfaces for ticket data
export interface Ticket {
  id: string;
  booking_id: string;
  event_id: string;
  ticket_number: string;
  user_id: string;
  seat_id?: string;
  seat_info?: {
    section: string;
    row: string;
    number: string;
  };
  ticket_type: string;
  price: number;
  status: 'active' | 'used' | 'cancelled' | 'expired';
  check_in_time?: string;
  qr_code_url?: string;
  barcode_url?: string;
  created_at: string;
  updated_at: string;
}

export interface TicketResponse {
  status: string;
  data: Ticket;
}

export interface TicketsResponse {
  status: string;
  data: {
    tickets: Ticket[];
    total: number;
    page: number;
    limit: number;
  };
}

export interface CheckInRequest {
  ticket_id: string;
  event_id: string;
  check_in_location?: string;
  device_id?: string;
  notes?: string;
}

export interface CheckInResponse {
  status: string;
  data: {
    success: boolean;
    message: string;
    ticket: Ticket;
  };
}

export interface GenerateTicketsRequest {
  booking_id: string;
  event_id: string;
  user_id: string;
  email?: string;
  send_email?: boolean;
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

// TicketApi service
const ticketApi = {
  /**
   * Get tickets by booking ID
   * @param bookingId Booking ID
   */
  getTicketsByBookingId: (bookingId: string) => {
    return apiClient.get<TicketsResponse>(`/bookings/${bookingId}/tickets`);
  },

  /**
   * Get ticket by ID
   * @param ticketId Ticket ID
   */
  getTicketById: (ticketId: string) => {
    return apiClient.get<TicketResponse>(`/tickets/${ticketId}`);
  },

  /**
   * Generate tickets for a booking
   * @param data Ticket generation data
   */
  generateTickets: (data: GenerateTicketsRequest) => {
    return apiClient.post<TicketsResponse>('/tickets/generate', data);
  },

  /**
   * Cancel a ticket
   * @param ticketId Ticket ID
   * @param reason Optional cancellation reason
   */
  cancelTicket: (ticketId: string, reason?: string) => {
    return apiClient.patch<TicketResponse>(`/tickets/${ticketId}/cancel`, { reason });
  },

  /**
   * Check in a ticket at event
   * @param data Check-in data
   */
  checkInTicket: (data: CheckInRequest) => {
    return apiClient.post<CheckInResponse>('/tickets/check-in', data);
  },

  /**
   * Resend ticket to user's email
   * @param ticketId Ticket ID
   * @param email Optional different email to send to
   */
  resendTicket: (ticketId: string, email?: string) => {
    return apiClient.post<{ status: string; message: string }>(`/tickets/${ticketId}/resend`, { email });
  },

  /**
   * Verify ticket validity
   * @param ticketId Ticket ID
   * @param eventId Event ID
   */
  verifyTicket: (ticketId: string, eventId: string) => {
    return apiClient.get<{ status: string; data: { valid: boolean; message: string; ticket?: Ticket } }>(
      `/tickets/${ticketId}/verify?event_id=${eventId}`
    );
  },

  /**
   * Get user's tickets
   * @param userId User ID
   * @param page Page number
   * @param limit Items per page
   * @param status Optional ticket status filter
   */
  getUserTickets: (userId: string, page = 1, limit = 10, status?: string) => {
    const query = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(status && { status }),
    }).toString();

    return apiClient.get<TicketsResponse>(`/users/${userId}/tickets?${query}`);
  },

  /**
   * Download ticket as PDF
   * @param ticketId Ticket ID
   */
  downloadTicket: (ticketId: string) => {
    return apiClient.get<Blob>(`/tickets/${ticketId}/download`, {
      responseType: 'blob'
    });
  },

  /**
   * Get event tickets for admin/organizer
   * @param eventId Event ID
   * @param page Page number
   * @param limit Items per page
   * @param status Optional ticket status filter
   */
  getEventTickets: (eventId: string, page = 1, limit = 50, status?: string) => {
    const query = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(status && { status }),
    }).toString();

    return apiClient.get<TicketsResponse>(`/events/${eventId}/tickets?${query}`);
  },

  /**
   * Update ticket information (admin only)
   * @param ticketId Ticket ID
   * @param data Updated ticket data
   */
  updateTicket: (ticketId: string, data: Partial<Ticket>) => {
    return apiClient.patch<TicketResponse>(`/tickets/${ticketId}`, data);
  }
};

export default ticketApi; 