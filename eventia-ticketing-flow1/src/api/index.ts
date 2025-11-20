import axios from 'axios';
import { toast } from '@/hooks/use-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Add a request interceptor
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('token');
    
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

// Add a response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle common errors
    if (error.response) {
      // Server responded with a status code outside of 2xx range
      const status = error.response.status;
      
      if (status === 401) {
        // Unauthorized - clear token and redirect to login
        localStorage.removeItem('token');
        window.location.href = '/login';
        toast({
          title: 'Session expired',
          description: 'Please log in again to continue.',
          variant: 'destructive',
        });
      } else if (status === 403) {
        // Forbidden
        toast({
          title: 'Access denied',
          description: 'You do not have permission to perform this action.',
          variant: 'destructive',
        });
      } else if (status === 404) {
        // Not found
        toast({
          title: 'Resource not found',
          description: 'The requested resource could not be found.',
          variant: 'destructive',
        });
      } else if (status === 500) {
        // Server error
        toast({
          title: 'Server error',
          description: 'Something went wrong on our end. Please try again later.',
          variant: 'destructive',
        });
      }
    } else if (error.request) {
      // Request was made but no response was received
      toast({
        title: 'Network error',
        description: 'Unable to connect to the server. Please check your internet connection.',
        variant: 'destructive',
      });
    } else {
      // Something happened in setting up the request
      toast({
        title: 'Request error',
        description: error.message || 'An error occurred while processing your request.',
        variant: 'destructive',
      });
    }
    
    return Promise.reject(error);
  }
);

// Mobile performance metrics types
interface MobilePerformanceMetrics {
  deviceType: string;
  browserName: string;
  browserVersion: string;
  networkType?: string;
  sessionId: string;
  timestamp: number;
  url: string;
  metrics: {
    lcp?: number; // Largest Contentful Paint
    fid?: number; // First Input Delay
    cls?: number; // Cumulative Layout Shift
    fcp?: number; // First Contentful Paint
    ttfb?: number; // Time to First Byte
    inp?: number; // Interaction to Next Paint
  };
}

type TimeframeOption = '1h' | '6h' | '24h' | '7d' | '30d';
type MetricType = 'lcp' | 'fid' | 'cls' | 'fcp' | 'ttfb' | 'inp';

// Mobile performance metrics API
export const mobileMetricsApi = {
  // Record mobile performance metrics
  recordMetrics: async (metricsData: MobilePerformanceMetrics) => {
    return api.post('/metrics/mobile', metricsData);
  },
  
  // Get aggregated metrics with timeframe and percentile data
  getAggregatedMetrics: async (timeframe: TimeframeOption = '24h', metric: MetricType = 'lcp') => {
    return api.get(`/metrics/mobile/aggregate?timeframe=${timeframe}&metric=${metric}`);
  },
  
  // Get metrics for a specific session
  getSessionMetrics: async (sessionId: string) => {
    return api.get(`/metrics/mobile/session/${sessionId}`);
  }
};

export default api;