/**
 * @file baseApiService.ts
 * @description Base class for all API services
 * Provides standard methods for API calls with proper typing and error handling
 */

import { AxiosInstance, AxiosRequestConfig } from 'axios';
import { apiClient } from './clientFactory';
import { ApiResponse, PaginatedResponse, PaginationParams } from '@/types/api';
import { unwrapApiResponse } from './responseUtils';

export class BaseApiService {
  protected client: AxiosInstance;
  protected baseUrl: string;

  /**
   * Create a new API service instance
   * @param baseUrl The base URL for all endpoints in this service
   * @param client Optional custom axios instance (defaults to the shared apiClient)
   */
  constructor(baseUrl: string, client: AxiosInstance = apiClient) {
    this.baseUrl = baseUrl;
    this.client = client;
  }

  /**
   * Extract data from standard API response
   * @param response Axios response with ApiResponse wrapper
   * @returns Extracted data from the API response
   * @throws Error if response format is invalid
   */
  protected extractData<T>(response: any): T {
    return unwrapApiResponse<T>(response);
  }

  /**
   * Make a GET request to fetch data
   * @param endpoint The endpoint to call (will be appended to baseUrl)
   * @param params Optional query parameters
   * @param config Optional axios request configuration
   * @returns Extracted data from the API response
   */
  protected async get<T>(
    endpoint: string, 
    params?: Record<string, any>, 
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.client.get<ApiResponse<T>>(
      `${this.baseUrl}${endpoint}`,
      { 
        params,
        ...config
      }
    );
    return this.extractData(response);
  }

  /**
   * Make a GET request that returns paginated data
   * @param endpoint The endpoint to call (will be appended to baseUrl)
   * @param params Pagination parameters and any additional query params
   * @param config Optional axios request configuration
   * @returns Paginated response data
   */
  protected async getPaginated<T>(
    endpoint: string, 
    params: PaginationParams & Record<string, any> = { page: 1, limit: 10 },
    config?: AxiosRequestConfig
  ): Promise<PaginatedResponse<T>> {
    const response = await this.client.get<ApiResponse<PaginatedResponse<T>>>(
      `${this.baseUrl}${endpoint}`,
      { 
        params,
        ...config
      }
    );
    return this.extractData(response);
  }

  /**
   * Make a POST request to create data
   * @param endpoint The endpoint to call (will be appended to baseUrl)
   * @param data The data to send in the request body
   * @param config Optional axios request configuration
   * @returns Extracted data from the API response
   */
  protected async post<T, D = any>(
    endpoint: string, 
    data: D, 
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.client.post<ApiResponse<T>>(
      `${this.baseUrl}${endpoint}`,
      data,
      config
    );
    return this.extractData(response);
  }

  /**
   * Make a PUT request to update data
   * @param endpoint The endpoint to call (will be appended to baseUrl)
   * @param data The data to send in the request body
   * @param config Optional axios request configuration
   * @returns Extracted data from the API response
   */
  protected async put<T, D = any>(
    endpoint: string, 
    data: D, 
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.client.put<ApiResponse<T>>(
      `${this.baseUrl}${endpoint}`,
      data,
      config
    );
    return this.extractData(response);
  }

  /**
   * Make a PATCH request to partially update data
   * @param endpoint The endpoint to call (will be appended to baseUrl)
   * @param data The data to send in the request body
   * @param config Optional axios request configuration
   * @returns Extracted data from the API response
   */
  protected async patch<T, D = any>(
    endpoint: string, 
    data: D, 
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.client.patch<ApiResponse<T>>(
      `${this.baseUrl}${endpoint}`,
      data,
      config
    );
    return this.extractData(response);
  }

  /**
   * Make a DELETE request
   * @param endpoint The endpoint to call (will be appended to baseUrl)
   * @param config Optional axios request configuration
   * @returns Extracted data from the API response
   */
  protected async delete<T>(
    endpoint: string, 
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.client.delete<ApiResponse<T>>(
      `${this.baseUrl}${endpoint}`,
      config
    );
    return this.extractData(response);
  }
} 
