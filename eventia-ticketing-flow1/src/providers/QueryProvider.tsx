import { QueryClient, QueryClientProvider, QueryErrorResetBoundary } from '@tanstack/react-query';
import { ReactNode, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Default query client configuration
const defaultOptions = {
  queries: {
    refetchOnWindowFocus: import.meta.env.PROD, // Only in production
    refetchOnMount: true,
    refetchOnReconnect: true,
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (previously called cacheTime)
  },
  mutations: {
    retry: 1,
  },
};

interface QueryProviderProps {
  children: ReactNode;
  withSuspense?: boolean;
  withErrorBoundary?: boolean;
}

export function QueryProvider({ 
  children, 
  withSuspense = false, 
  withErrorBoundary = true 
}: QueryProviderProps) {
  // Create a client instance per component tree to avoid shared state issues
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      ...defaultOptions,
      queries: {
        ...defaultOptions.queries,
        // Type assertion to avoid linter errors
        ...(withSuspense ? { suspense: true } : {}),
        useErrorBoundary: withErrorBoundary,
      }
    },
  }));

  // Fallback component for error boundary
  const ErrorFallback = ({ error, resetErrorBoundary }: {
    error: Error;
    resetErrorBoundary: () => void;
  }) => (
    <Alert variant="destructive" className="my-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Something went wrong!</AlertTitle>
      <AlertDescription>
        <div className="mb-2">{error.message || 'An error occurred while fetching data'}</div>
        <Button onClick={resetErrorBoundary} variant="outline" size="sm">
          Try again
        </Button>
      </AlertDescription>
    </Alert>
  );

  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          fallbackRender={ErrorFallback}
          onReset={reset}
          // Only render error boundary if enabled
          {...(withErrorBoundary ? {} : { fallback: <>{children}</> })}
        >
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}

// For backwards compatibility
export const queryClient = new QueryClient({ defaultOptions });

// Export the client instance creator for direct access
export const createQueryClient = () => new QueryClient({ defaultOptions }); 