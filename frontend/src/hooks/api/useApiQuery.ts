import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryOptions,
  UseMutationOptions,
  QueryKey,
} from '@tanstack/react-query';
import { AxiosError, AxiosResponse } from 'axios';
import apiClient from '@/services/api/apiClient';

// Error type definition
export interface ApiError {
  message: string;
  statusCode: number;
  errors?: Record<string, string[]>;
}

// Extended UseQueryOptions type that includes our common callbacks
export interface ApiQueryOptions<T> extends Omit<UseQueryOptions<T, AxiosError<ApiError>, T, any>, 'queryKey' | 'queryFn'> {
  onSuccess?: (data: T) => void;
  onError?: (error: AxiosError<ApiError>) => void;
}

// Types for query and mutation operations
type QueryFn<T> = () => Promise<T>;
type MutationFn<T, V> = (variables: V) => Promise<T>;

// Generic API hooks
export function useApiQuery<T>(
  queryKey: QueryKey,
  url: string,
  options?: UseQueryOptions<T, AxiosError<ApiError>, T, QueryKey>
) {
  const queryFn = async (): Promise<T> => {
    const response = await apiClient.get<T>(url);
    return response.data;
  };

  return useQuery<T, AxiosError<ApiError>, T>({
    queryKey,
    queryFn,
    ...options,
  });
}

export function useApiMutation<T, V = unknown>(
  url: string,
  method: 'post' | 'put' | 'patch' | 'delete' = 'post',
  options?: Omit<
    UseMutationOptions<T, AxiosError<ApiError>, V>,
    'mutationFn'
  >
) {
  const queryClient = useQueryClient();

  const mutationFn = async (variables: V): Promise<T> => {
    let response: AxiosResponse<T>;

    switch (method) {
      case 'post':
        response = await apiClient.post<T>(url, variables);
        break;
      case 'put':
        response = await apiClient.put<T>(url, variables);
        break;
      case 'patch':
        response = await apiClient.patch<T>(url, variables);
        break;
      case 'delete':
        response = await apiClient.delete<T>(`${url}${variables ? `/${variables}` : ''}`);
        break;
      default:
        throw new Error(`Unsupported method: ${method}`);
    }

    return response.data;
  };

  return useMutation<T, AxiosError<ApiError>, V>({
    mutationFn,
    ...options,
  });
}

// Specialized hooks for common patterns
export function useApiGet<T>(
  queryKey: QueryKey,
  url: string,
  options?: UseQueryOptions<T, AxiosError<ApiError>, T, QueryKey>
) {
  return useApiQuery<T>(queryKey, url, options);
}

export function useApiPost<T, V = unknown>(
  url: string,
  options?: Omit<
    UseMutationOptions<T, AxiosError<ApiError>, V>,
    'mutationFn'
  >
) {
  return useApiMutation<T, V>(url, 'post', options);
}

export function useApiPut<T, V = unknown>(
  url: string,
  options?: Omit<
    UseMutationOptions<T, AxiosError<ApiError>, V>,
    'mutationFn'
  >
) {
  return useApiMutation<T, V>(url, 'put', options);
}

export function useApiPatch<T, V = unknown>(
  url: string,
  options?: Omit<
    UseMutationOptions<T, AxiosError<ApiError>, V>,
    'mutationFn'
  >
) {
  return useApiMutation<T, V>(url, 'patch', options);
}

export function useApiDelete<T = void, V = unknown>(
  url: string,
  options?: Omit<
    UseMutationOptions<T, AxiosError<ApiError>, V>,
    'mutationFn'
  >
) {
  return useApiMutation<T, V>(url, 'delete', options);
}

// Hook for paginated queries
export function usePaginatedQuery<T>(
  queryKey: QueryKey,
  url: string,
  page: number,
  pageSize: number,
  options?: UseQueryOptions<T, AxiosError<ApiError>, T, QueryKey>
) {
  const queryFn = async (): Promise<T> => {
    const response = await apiClient.get<T>(`${url}?page=${page}&limit=${pageSize}`);
    return response.data;
  };

  return useQuery<T, AxiosError<ApiError>, T>({
    queryKey: [...queryKey, page, pageSize],
    queryFn,
    ...options,
  });
} 