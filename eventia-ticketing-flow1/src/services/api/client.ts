import axios from 'axios';

// Use VITE_API_URL for Vite-based applications
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Get token from localStorage or cookie
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    
    // If token exists, add to headers
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle 401 Unauthorized globally
    if (error.response && error.response.status === 401) {
      // Clear stored tokens
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
      }
      
      // Redirect to login page if in browser
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login?session_expired=true';
      }
    }
    
    return Promise.reject(error);
  }
); 