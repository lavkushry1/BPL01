import React, { createContext, useContext, ReactNode } from 'react';
import tokens from './tokens.json';

// Create a type-safe context for our theme
export type ThemeTokens = typeof tokens;

const ThemeContext = createContext<ThemeTokens | undefined>(undefined);

export function useTheme(): ThemeTokens {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

type ThemeProviderProps = {
  children: ReactNode;
};

export function ThemeProvider({ children }: ThemeProviderProps) {
  return (
    <ThemeContext.Provider value={tokens}>
      {children}
    </ThemeContext.Provider>
  );
} 