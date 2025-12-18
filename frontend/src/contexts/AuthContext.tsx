import { login as apiLogin, logout as apiLogout, AuthResponse, getCurrentUser } from '@/services/api/authApi';
import React, { createContext, useEffect, useState } from 'react';

type AppUser = {
  id: string;
  email: string;
  name: string;
  role: string;
} | null;

interface AuthContextType {
  user: AppUser;
  isLoading: boolean;
  persist: boolean;
  accessToken: string;
  setUser: React.Dispatch<React.SetStateAction<AppUser>>;
  setPersist: React.Dispatch<React.SetStateAction<boolean>>;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
  setAccessToken: (token: string) => void; // For refresh/persist compatibility
}

const defaultValue: AuthContextType = {
  user: null,
  isLoading: true,
  persist: false,
  accessToken: '',
  setUser: () => {},
  setPersist: () => {},
  isAuthenticated: false,
  login: async () => ({ user: { id: '', email: '', name: '', role: 'admin' } }),
  logout: async () => {},
  refreshSession: async () => false,
  setAccessToken: () => { }
};

const AuthContext = createContext<AuthContextType>(defaultValue);

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [user, setUser] = useState<AppUser>(null);
  const [accessToken, setAccessToken] = useState<string>('');
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

        if (userData) {
          setUser({
            id: userData.id,
            email: userData.email,
            name: userData.name,
            role: userData.role
          });
        } else {
          setUser(null);
        }
      } catch (error) {
        // Silent fail on session validation - just means not logged in
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

    // Update user state directly from login response
    if (response.user) {
      setUser({
        id: response.user.id,
        email: response.user.email,
        name: response.user.name,
        role: response.user.role
      });
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
      setAccessToken('');
    }
  };

  // Add a function to refresh the session
  const refreshSession = async (): Promise<boolean> => {
    try {
      // Get current user data
      const userData = await getCurrentUser();

      if (userData) {
        setUser({
          id: userData.id,
          email: userData.email,
          name: userData.name,
          role: userData.role
        });
        return true;
      } else {
        setUser(null);
        return false;
      }
    } catch (error) {
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
      accessToken,
      setUser,
      setPersist,
      isAuthenticated,
      login,
      logout,
      refreshSession,
      setAccessToken
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
