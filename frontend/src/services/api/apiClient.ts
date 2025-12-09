import { defaultApiClient } from './apiUtils';
import { unwrapApiResponse } from './responseUtils';

// Backwards compatibility re-export: use the cookie-aware default client everywhere
export const apiClient = defaultApiClient;

export const api = {
  async get<T>(url: string, config?: any): Promise<T> {
    const response = await apiClient.get(url, config);
    return unwrapApiResponse<T>(response);
  },
  async post<T>(url: string, data?: any, config?: any): Promise<T> {
    const response = await apiClient.post(url, data, config);
    return unwrapApiResponse<T>(response);
  },
  async put<T>(url: string, data?: any, config?: any): Promise<T> {
    const response = await apiClient.put(url, data, config);
    return unwrapApiResponse<T>(response);
  },
  async delete<T>(url: string, config?: any): Promise<T> {
    const response = await apiClient.delete(url, config);
    return unwrapApiResponse<T>(response);
  }
};

export default apiClient;
