import apiUtils, { 
  API_BASE_URL, 
  createApiClient, 
  defaultApiClient,
  isAuthenticated,
  getAuthToken,
  setAuthToken,
  clearAuthToken
} from './apiUtils';
import bookingApi from './bookingApi';
import eventApi from './eventApi';
import paymentApi from './paymentApi';
import seatMapApi from './seatMapApi';
import ticketApi from './ticketApi';
import userApi from './userApi';

// Export utilities
export { 
  API_BASE_URL,
  createApiClient,
  defaultApiClient,
  isAuthenticated,
  getAuthToken,
  setAuthToken,
  clearAuthToken
};

// Export all API services
export {
  bookingApi,
  eventApi,
  paymentApi,
  seatMapApi,
  ticketApi,
  userApi
};

// Export default object with all services
export default {
  // Utils
  utils: apiUtils,
  
  // API services
  booking: bookingApi,
  event: eventApi,
  payment: paymentApi,
  seatMap: seatMapApi,
  ticket: ticketApi,
  user: userApi
}; 