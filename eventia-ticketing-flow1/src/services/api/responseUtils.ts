import { AxiosResponse } from 'axios';

/**
 * Normalize backend responses that follow the `{ status, data, message }` shape
 * and gracefully fall back to returning the raw payload when no `data` wrapper
 * exists. This keeps call sites consistent regardless of endpoint variations.
 */
export const unwrapApiResponse = <T>(response: AxiosResponse<any>): T => {
  const payload = response?.data;
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as any).data as T;
  }
  return payload as T;
};
