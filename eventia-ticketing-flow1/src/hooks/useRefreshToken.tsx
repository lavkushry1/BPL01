import { API_URL } from '@/services/api/apiUtils';
import useAuth from './useAuth';
import axios from 'axios';

/**
 * Custom hook to refresh the access token using refresh token stored in HTTP-only cookie
 * @returns A function that when called, refreshes the access token
 */
const useRefreshToken = () => {
  const { setAccessToken, setUser } = useAuth();

  const refresh = async () => {
    try {
      // Use a separate axios instance (not the one with auth headers)
      const response = await axios.get(`${API_URL}/auth/refresh`, {
        withCredentials: true // Important: needed to include cookies in the request
      });

      // Set the new access token and user
      setAccessToken(response.data.accessToken);
      setUser(response.data.user);

      return response.data.accessToken;
    } catch (error) {
      console.error('Error refreshing token:', error);
      // Clear user state on refresh failure
      setAccessToken('');
      setUser(null);
      return null;
    }
  };

  return refresh;
};

export default useRefreshToken; 