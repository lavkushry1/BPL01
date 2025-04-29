import { useContext } from 'react';
import AuthContext from '@/contexts/AuthContext';

/**
 * Custom hook to access the authentication context
 * Provides access to user data, authentication status, and auth-related functions
 */
const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

export default useAuth; 