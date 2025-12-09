import axios from 'axios';
import { API_URL } from '@/services/api/apiUtils';
import useAuth from './useAuth';

/**
 * Custom hook to handle user logout
 * Clears auth state and invalidates refresh token on the server
 */
const useLogout = () => {
  const { setUser, setAccessToken } = useAuth();

  const logout = async () => {
    try {
      // Try to call the logout endpoint to invalidate the refresh token
      await axios.post(`${API_URL}/auth/logout`, {}, {
        withCredentials: true // Important for including the refresh token cookie
      });
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      // Clear auth state regardless of API success
      setUser(null);
      setAccessToken('');
    }
  };

  return logout;
};

export default useLogout; 