import React, { ReactNode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ThemeProvider } from '@/styles/ThemeProvider';
import { AuthProvider } from '@/contexts/AuthContext';
import { AppStateProvider } from '@/contexts/AppStateContext';
import { LanguageProvider, useLanguage } from '@/contexts/LanguageContext';
import { CartProvider } from '@/hooks/useCart';
import RTLProvider from '@/components/ui/RTLProvider';

/**
 * A component that combines all providers to reduce nesting in the main App component
 * This optimizes performance by reducing the number of React components in the tree
 */
interface CombinedProvidersProps {
  children: ReactNode;
  queryClient: QueryClient;
}

// Wrapper component to connect LanguageProvider with RTLProvider
const LanguageWrapper = ({ children }: { children: React.ReactNode }) => {
  const { currentLanguage } = useLanguage();

  return (
    <RTLProvider currentLanguage={currentLanguage}>
      {children}
    </RTLProvider>
  );
};

export const CombinedProviders: React.FC<CombinedProvidersProps> = ({ 
  children,
  queryClient
}) => {
  // Using React Fragment for the outermost element to avoid creating unnecessary DOM nodes
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AppStateProvider>
          <AuthProvider>
            <CartProvider>
              <LanguageProvider>
                <LanguageWrapper>
                  <TooltipProvider>
                    <BrowserRouter>
                      {children}
                    </BrowserRouter>
                  </TooltipProvider>
                </LanguageWrapper>
              </LanguageProvider>
            </CartProvider>
          </AuthProvider>
        </AppStateProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default CombinedProviders; 