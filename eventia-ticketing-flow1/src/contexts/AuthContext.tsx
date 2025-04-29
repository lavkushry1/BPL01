import React, { createContext, useState, useEffect } from 'react';
import { defaultApiClient } from '@/services/api/apiUtils';
import { refreshToken } from '@/services/api/authApi';

type User = {
  id: string;
  email: string;
  name: string;
  role: string;
} | null;

interface AuthContextType {
  user: User;
  accessToken: string;
  setUser: React.Dispatch<React.SetStateAction<User>>;
  setAccessToken: React.Dispatch<React.SetStateAction<string>>;
  isAuthenticated: boolean;
  persist: boolean;
  setPersist: React.Dispatch<React.SetStateAction<boolean>>;
  logout: () => Promise<void>;
}

const defaultValue: AuthContextType = {
  user: null,
  accessToken: '',
  setUser: () => {},
  setAccessToken: () => {},
  isAuthenticated: false,
  persist: false,
  setPersist: () => {},
  logout: async () => {},
};

const AuthContext = createContext<AuthContextType>(defaultValue);

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [user, setUser] = useState<User>(() => {
    // Try to get user from sessionStorage
    const storedUser = sessionStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  
  const [accessToken, setAccessToken] = useState<string>(() => {
    // Try to get token from sessionStorage
    return sessionStorage.getItem('accessToken') || '';
  });
  
  const [persist, setPersist] = useState<boolean>(() => {
    const persistValue = localStorage.getItem('persist');
    return persistValue ? JSON.parse(persistValue) : false;
  });

  // Update axios authorization header when accessToken changes
  useEffect(() => {
    if (accessToken) {
      defaultApiClient.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      
      // Save token if persist is enabled (for session continuity)
      if (persist) {
        sessionStorage.setItem('accessToken', accessToken);
        if (user) {
          sessionStorage.setItem('user', JSON.stringify(user));
        }
      }
    } else {
      delete defaultApiClient.defaults.headers.common['Authorization'];
      
      // Remove from sessionStorage if logging out
      sessionStorage.removeItem('accessToken');
      sessionStorage.removeItem('user');
    }
  }, [accessToken, user, persist]);

  // Save persist preference to localStorage
  useEffect(() => {
    localStorage.setItem('persist', JSON.stringify(persist));
  }, [persist]);

  // Add a logout function to the context
  const logout = async () => {
    try {
      // Call the logout endpoint to invalidate the refresh token cookie
      await defaultApiClient.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear local state regardless of API success/failure
      setUser(null);
      setAccessToken('');
      sessionStorage.removeItem('accessToken');
      sessionStorage.removeItem('user');
    }
  };

  const isAuthenticated = !!accessToken;

  return (
    <AuthContext.Provider value={{
      user,
      accessToken,
      setUser,
      setAccessToken,
      isAuthenticated,
      persist,
      setPersist,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 