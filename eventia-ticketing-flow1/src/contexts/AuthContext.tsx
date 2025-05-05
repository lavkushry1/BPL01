import React, { createContext, useState, useEffect } from 'react';
import { defaultApiClient } from '@/services/api/apiUtils';
import { getCurrentUser, logout as apiLogout, login as apiLogin, AuthResponse } from '@/services/api/authApi';

type AdminUser = {
  id: string;
  email: string;
  name: string;
  role: 'admin';
} | null;

interface AuthContextType {
  user: AdminUser;
  isLoading: boolean;
  persist: boolean;
  setUser: React.Dispatch<React.SetStateAction<AdminUser>>;
  setPersist: React.Dispatch<React.SetStateAction<boolean>>;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
}

const defaultValue: AuthContextType = {
  user: null,
  isLoading: true,
  persist: false,
  setUser: () => {},
  setPersist: () => {},
  isAuthenticated: false,
  login: async () => ({ user: { id: '', email: '', name: '', role: 'admin' } }),
  logout: async () => {},
  refreshSession: async () => false
};

const AuthContext = createContext<AuthContextType>(defaultValue);

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [user, setUser] = useState<AdminUser>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Add persist state to remember user preference on page reload
  const [persist, setPersist] = useState<boolean>(() => {
    const persistValue = localStorage.getItem('persist');
    return persistValue === 'true';
  });

  // Validate session when the component mounts
  useEffect(() => {
    const validateSession = async () => {
      setIsLoading(true);
      try {
        // Use the getCurrentUser endpoint to validate session
        const userData = await getCurrentUser();
        
        // Check if the user is an admin
        if (userData.role?.toLowerCase() === 'admin') {
          setUser({
            id: userData.id,
            email: userData.email,
            name: userData.name,
            role: 'admin'
          });
        } else {
          // If user is not an admin, set user to null
          setUser(null);
        }
      } catch (error) {
        console.error('Session validation error:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    
    validateSession();
  }, []);

  // Save persist preference
  useEffect(() => {
    localStorage.setItem('persist', persist.toString());
  }, [persist]);

  // Add login function to the context
  const login = async (email: string, password: string): Promise<AuthResponse> => {
    const response = await apiLogin(email, password);
    
    // Only set user if the user is an admin
    if (response.user.role?.toLowerCase() === 'admin') {
      setUser(response.user as AdminUser);
    }
    
    return response;
  };

  // Add a logout function to the context
  const logout = async () => {
    try {
      // Call the logout endpoint to invalidate the cookie
      await apiLogout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear local state regardless of API success/failure
      setUser(null);
    }
  };

  // Add a function to refresh the session
  const refreshSession = async (): Promise<boolean> => {
    try {
      // Get current user data
      const userData = await getCurrentUser();
      
      // Check if the user is an admin
      if (userData.role?.toLowerCase() === 'admin') {
        setUser({
          id: userData.id,
          email: userData.email,
          name: userData.name,
          role: 'admin'
        });
        return true;
      } else {
        // If user is not an admin, set user to null
        setUser(null);
        return false;
      }
    } catch (error) {
      console.error('Session refresh error:', error);
      setUser(null);
      return false;
    }
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      persist,
      setUser,
      setPersist,
      isAuthenticated,
      login,
      logout,
      refreshSession
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 