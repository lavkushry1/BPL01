/**
 * @service BookingApiService
 * @description Service for handling booking-related API calls to the Express backend.
 */
import { defaultApiClient } from './apiUtils';
import { unwrapApiResponse } from './responseUtils';

export interface BookingRequest {
  eventId: string;
  quantity: number;
  seats?: {
    section: string;
    row: string;
    seatNumber: number;
  }[];
  discountCode?: string;
}

export interface Booking {
  id: string;
  userId: string;
  eventId: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'REFUNDED';
  quantity: number;
  finalAmount: number;
  seats?: any;
  discountId?: string;
  createdAt: string;
  updatedAt: string;
  event?: any;
  payment?: {
    id: string;
    amount: number;
    status: string;
    method?: string;
  };
  deliveryDetails?: {
    id: string;
    name: string;
    email: string;
    phone: string;
    address?: string;
  };
}

export interface DeliveryDetailsRequest {
  bookingId: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
}

/**
 * Create a new booking with retry logic
 */
export const createBooking = async (bookingData: BookingRequest, maxRetries = 2): Promise<Booking> => {
  let attempt = 0;
  let lastError;

  while (attempt <= maxRetries) {
    try {
      // Add clientTimestamp for request tracking
      const requestData = {
        ...bookingData,
        clientTimestamp: new Date().toISOString()
      };

      const response = await defaultApiClient.post('/bookings', requestData);
      const booking = unwrapApiResponse<{ booking: Booking }>(response)?.booking;
      if (booking?.id) {
        localStorage.setItem('last_booking_id', booking.id);
        localStorage.removeItem('booking_error');
      }
      if (!booking) {
        throw new Error('Invalid booking response');
      }
      return booking;
    } catch (error: any) {
      attempt++;
      lastError = error;

      // Check if this is a server error (5xx) that might be temporary
      const isServerError = error.response?.status >= 500;
      // Don't retry if it's a client error (4xx) as these won't succeed with retries
      const isClientError = error.response?.status >= 400 && error.response?.status < 500;

      if (isClientError || attempt > maxRetries) {
        // Store error information for recovery
        if (error.response?.data?.message) {
          localStorage.setItem('booking_error', JSON.stringify({
            message: error.response.data.message,
            timestamp: new Date().toISOString(),
            status: error.response.status
          }));
        }

        console.error(`Error creating booking (attempt ${attempt}/${maxRetries + 1}):`, error);
        break;
      }

      // If it's a server error, wait before retrying
      if (isServerError) {
        // Exponential backoff: 1s, 2s, 4s, etc.
        const backoffTime = Math.pow(2, attempt - 1) * 1000;
        console.warn(`Booking request failed. Retrying in ${backoffTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, backoffTime));
      }
    }
  }

  // If we've exhausted retries, throw the last error
  throw lastError;
};

/**
 * Recovery function to check for pending bookings
 */
export const checkPendingBooking = async (): Promise<Booking | null> => {
  const lastBookingId = localStorage.getItem('last_booking_id');

  if (!lastBookingId) {
    return null;
  }

  try {
    const booking = await getBookingById(lastBookingId);

    // If booking is in a terminal state, clear the stored ID
    if (['CONFIRMED', 'CANCELLED', 'REFUNDED'].includes(booking.status)) {
      localStorage.removeItem('last_booking_id');
    }

    return booking;
  } catch (error) {
    console.error('Error checking pending booking:', error);
    return null;
  }
};

/**
 * Get a booking by ID
 */
export const getBookingById = async (bookingId: string): Promise<Booking> => {
  try {
    const response = await defaultApiClient.get(`/bookings/${bookingId}`);
    const booking = unwrapApiResponse<{ booking: Booking }>(response)?.booking;
    if (!booking) {
      throw new Error('Booking not found');
    }
    return booking;
  } catch (error) {
    console.error(`Error fetching booking ${bookingId}:`, error);
    throw error;
  }
};

/**
 * Get all bookings for the authenticated user
 */
export const getUserBookings = async (): Promise<Booking[]> => {
  try {
    const response = await defaultApiClient.get('/bookings');
    return unwrapApiResponse<{ bookings: Booking[] }>(response)?.bookings || [];
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    throw error;
  }
};

/**
 * Cancel a booking
 */
export const cancelBooking = async (bookingId: string): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await defaultApiClient.post(`/bookings/${bookingId}/cancel`);
    return unwrapApiResponse(response);
  } catch (error) {
    console.error(`Error cancelling booking ${bookingId}:`, error);
    throw error;
  }
};

/**
 * Add delivery details to a booking
 */
export const addDeliveryDetails = async (deliveryData: DeliveryDetailsRequest): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await defaultApiClient.post('/bookings/delivery-details', deliveryData);
    return unwrapApiResponse(response);
  } catch (error) {
    console.error('Error adding delivery details:', error);
    throw error;
  }
};

/**
 * Save delivery details for a booking
 */
export const saveDeliveryDetails = async (bookingId: string, deliveryData: {
  name: string;
  phone: string;
  address: string;
  city: string;
  pincode: string;
}): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await defaultApiClient.post('/bookings/delivery-details', { booking_id: bookingId, ...deliveryData });
    return unwrapApiResponse(response);
  } catch (error) {
    console.error('Error saving delivery details:', error);
    throw error;
  }
};

/**
 * Get ticket PDF download URL
 */
export const getTicketPdfUrl = async (bookingId: string): Promise<string> => {
  try {
    const response = await defaultApiClient.get(`/bookings/${bookingId}/ticket-pdf`);
    const data = unwrapApiResponse<{ pdfUrl: string }>(response);
    return data?.pdfUrl;
  } catch (error) {
    console.error(`Error getting ticket PDF URL for booking ${bookingId}:`, error);
    throw error;
  }
};

/**
 * Get available seats for an event
 */
export const getAvailableSeats = async (eventId: string): Promise<any[]> => {
  try {
    const response = await defaultApiClient.get(`/events/${eventId}/seats`);
    return unwrapApiResponse<{ seats: any[] }>(response)?.seats || [];
  } catch (error) {
    console.error(`Error fetching available seats for event ${eventId}:`, error);
    throw error;
  }
};

/**
 * Lock selected seats temporarily
 */
export const lockSeats = async (eventId: string, seats: { seatId: string }[]): Promise<{ success: boolean; message: string; expiresAt: string }> => {
  try {
    const response = await defaultApiClient.post(`/events/${eventId}/seats/lock`, { seats });
    return unwrapApiResponse(response);
  } catch (error) {
    console.error(`Error locking seats for event ${eventId}:`, error);
    throw error;
  }
};

export default {
  createBooking,
  getBookingById,
  getUserBookings,
  cancelBooking,
  addDeliveryDetails,
  saveDeliveryDetails,
  getTicketPdfUrl,
  getAvailableSeats,
  lockSeats
};
