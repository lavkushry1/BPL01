import axios from 'axios';

// Create a default API client instance with common configuration
export const defaultApiClient = axios.create({
    baseURL: process.env.API_URL || 'http://localhost:4000/api/v1',
    headers: {
        'Content-Type': 'application/json',
    }
});

// API response handling
export const handleApiResponse = <T>(response: any): T => {
    return response.data;
};

// API error handling
export const handleApiError = (error: any): never => {
    if (error.response) {
        throw new Error(`API Error: ${error.response.status} ${error.response.data?.message || 'Unknown error'}`);
    } else if (error.request) {
        throw new Error('API Error: No response received');
    } else {
        throw new Error(`API Error: ${error.message}`);
    }
}; 