import React, { createContext, useState, useEffect } from 'react';
import { defaultApiClient } from '@/services/api/apiUtils';
import { refreshToken, login as apiLogin, AuthResponse } from '@/services/api/authApi';
import secureStorage from '@/utils/secureStorage';

type AdminUser = {
  id: string;
  email: string;
  name: string;
  role: 'admin';
} | null;

interface AuthContextType {
  user: AdminUser;
  accessToken: string;
  persist: boolean;
  setUser: React.Dispatch<React.SetStateAction<AdminUser>>;
  setAccessToken: React.Dispatch<React.SetStateAction<string>>;
  setPersist: React.Dispatch<React.SetStateAction<boolean>>;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<AuthResponse>;
  logout: () => Promise<void>;
}

const defaultValue: AuthContextType = {
  user: null,
  accessToken: '',
  persist: false,
  setUser: () => {},
  setAccessToken: () => {},
  setPersist: () => {},
  isAuthenticated: false,
  login: async () => ({ user: { id: '', email: '', name: '', role: 'admin' }, accessToken: '' }),
  logout: async () => {}
};

const AuthContext = createContext<AuthContextType>(defaultValue);

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [user, setUser] = useState<AdminUser>(() => {
    // Try to get user from storage
    const sessionUser = sessionStorage.getItem('admin_user');
    
    if (sessionUser) {
      try {
        return JSON.parse(sessionUser);
      } catch (e) {
        console.error('Failed to parse stored user data:', e);
      }
    }
    
    return null;
  });
  
  const [accessToken, setAccessToken] = useState<string>(() => {
    // Get token from secure storage
    const secureToken = secureStorage.getItem('admin_token');
    
    if (secureToken) {
      return secureToken;
    }
    
    return '';
  });

  // Add persist state to remember user on page reload
  const [persist, setPersist] = useState<boolean>(() => {
    const persistValue = localStorage.getItem('persist');
    return persistValue === 'true';
  });

  // Update axios authorization header when accessToken changes
  useEffect(() => {
    if (accessToken) {
      defaultApiClient.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      
      // Save token and user data
      secureStorage.setItem('admin_token', accessToken);
      if (user) {
        sessionStorage.setItem('admin_user', JSON.stringify(user));
      }
    } else {
      delete defaultApiClient.defaults.headers.common['Authorization'];
      
      // Remove stored tokens
      secureStorage.removeItem('admin_token');
      sessionStorage.removeItem('admin_user');
    }
  }, [accessToken, user]);

  // Save persist preference
  useEffect(() => {
    localStorage.setItem('persist', persist.toString());
  }, [persist]);

  // Add login function to the context
  const login = async (email: string, password: string): Promise<AuthResponse> => {
    const response = await apiLogin(email, password);
    
    // Only set user and token if the user is an admin
    if (response.user.role === 'admin') {
      setUser(response.user as AdminUser);
      setAccessToken(response.accessToken);
    }
    
    return response;
  };

  // Add a logout function to the context
  const logout = async () => {
    try {
      // Call the logout endpoint to invalidate the token
      await defaultApiClient.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear local state regardless of API success/failure
      setUser(null);
      setAccessToken('');
      secureStorage.removeItem('admin_token');
      sessionStorage.removeItem('admin_user');
      // Don't clear persist setting on logout
    }
  };

  const isAuthenticated = !!accessToken;

  return (
    <AuthContext.Provider value={{
      user,
      accessToken,
      persist,
      setUser,
      setAccessToken,
      setPersist,
      isAuthenticated,
      login,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 