import React, { createContext, useContext, useState, useReducer, useEffect, ReactNode, useMemo, useCallback } from 'react';

// Define types for our application state
type AppState = {
  isLoading: boolean;
  isOffline: boolean;
  notifications: Notification[];
  preferences: UserPreferences;
};

type UserPreferences = {
  showPromotions: boolean;
  enablePushNotifications: boolean;
  defaultPaymentMethod: string | null;
};

type Notification = {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: Date;
};

// Action types for our reducer
type AppAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_OFFLINE'; payload: boolean }
  | { type: 'ADD_NOTIFICATION'; payload: Omit<Notification, 'id' | 'createdAt' | 'read'> }
  | { type: 'MARK_NOTIFICATION_READ'; payload: string }
  | { type: 'REMOVE_NOTIFICATION'; payload: string }
  | { type: 'CLEAR_NOTIFICATIONS' }
  | { type: 'UPDATE_PREFERENCE'; payload: Partial<UserPreferences> };

// Initial state
const initialState: AppState = {
  isLoading: false,
  isOffline: false,
  notifications: [],
  preferences: {
    showPromotions: true,
    enablePushNotifications: false,
    defaultPaymentMethod: null,
  },
};

// Create the context
type AppStateContextType = {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  showLoader: () => void;
  hideLoader: () => void;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => void;
  updatePreferences: (preferences: Partial<UserPreferences>) => void;
};

const AppStateContext = createContext<AppStateContextType | undefined>(undefined);

// Selectors for common state portions
export const useLoading = () => {
  const context = useContext(AppStateContext);
  if (!context) throw new Error('useLoading must be used within AppStateProvider');
  return { 
    isLoading: context.state.isLoading,
    showLoader: context.showLoader,
    hideLoader: context.hideLoader
  };
};

export const useNotifications = () => {
  const context = useContext(AppStateContext);
  if (!context) throw new Error('useNotifications must be used within AppStateProvider');
  return { 
    notifications: context.state.notifications,
    addNotification: context.addNotification,
    markNotificationRead: (id: string) => context.dispatch({ type: 'MARK_NOTIFICATION_READ', payload: id }),
    removeNotification: (id: string) => context.dispatch({ type: 'REMOVE_NOTIFICATION', payload: id }),
    clearNotifications: () => context.dispatch({ type: 'CLEAR_NOTIFICATIONS' })
  };
};

export const usePreferences = () => {
  const context = useContext(AppStateContext);
  if (!context) throw new Error('usePreferences must be used within AppStateProvider');
  return { 
    preferences: context.state.preferences,
    updatePreferences: context.updatePreferences
  };
};

// Reducer function for state updates
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_OFFLINE':
      return { ...state, isOffline: action.payload };
    case 'ADD_NOTIFICATION':
      const newNotification: Notification = {
        id: Date.now().toString(),
        ...action.payload,
        read: false,
        createdAt: new Date(),
      };
      return {
        ...state,
        notifications: [newNotification, ...state.notifications].slice(0, 20), // Keep last 20 notifications
      };
    case 'MARK_NOTIFICATION_READ':
      return {
        ...state,
        notifications: state.notifications.map((notification) =>
          notification.id === action.payload ? { ...notification, read: true } : notification
        ),
      };
    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter((notification) => notification.id !== action.payload),
      };
    case 'CLEAR_NOTIFICATIONS':
      return {
        ...state,
        notifications: [],
      };
    case 'UPDATE_PREFERENCE':
      return {
        ...state,
        preferences: {
          ...state.preferences,
          ...action.payload,
        },
      };
    default:
      return state;
  }
}

// Provider component
export const AppStateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Helper functions for common actions - memoized to prevent unnecessary re-renders
  const showLoader = useCallback(() => dispatch({ type: 'SET_LOADING', payload: true }), []);
  const hideLoader = useCallback(() => dispatch({ type: 'SET_LOADING', payload: false }), []);

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => {
    dispatch({ type: 'ADD_NOTIFICATION', payload: notification });
  }, []);

  const updatePreferences = useCallback((preferences: Partial<UserPreferences>) => {
    dispatch({ type: 'UPDATE_PREFERENCE', payload: preferences });
    
    // Save to localStorage asynchronously to avoid blocking the main thread
    setTimeout(() => {
      try {
        const updatedPrefs = { ...state.preferences, ...preferences };
        localStorage.setItem('userPreferences', JSON.stringify(updatedPrefs));
      } catch (error) {
        console.error('Failed to save preferences:', error);
      }
    }, 0);
  }, [state.preferences]);

  // Check for network status
  useEffect(() => {
    const handleOnline = () => dispatch({ type: 'SET_OFFLINE', payload: false });
    const handleOffline = () => dispatch({ type: 'SET_OFFLINE', payload: true });

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Set initial state
    dispatch({ type: 'SET_OFFLINE', payload: !navigator.onLine });

    // Load saved preferences from localStorage
    const savedPreferences = localStorage.getItem('userPreferences');
    if (savedPreferences) {
      try {
        const parsedPreferences = JSON.parse(savedPreferences);
        dispatch({ type: 'UPDATE_PREFERENCE', payload: parsedPreferences });
      } catch (error) {
        console.error('Failed to parse saved preferences:', error);
      }
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    state,
    dispatch,
    showLoader,
    hideLoader,
    addNotification,
    updatePreferences,
  }), [state, showLoader, hideLoader, addNotification, updatePreferences]);

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
};

// Custom hook for using the context
export const useAppState = () => {
  const context = useContext(AppStateContext);
  if (context === undefined) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
}; 