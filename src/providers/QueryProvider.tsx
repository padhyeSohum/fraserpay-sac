
import React from 'react';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Create a client with robust error handling that won't freeze the app
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 60000, // 1 minute
      meta: {
        onError: (error: unknown) => {
          console.error('Query error:', error);
          // This prevents uncaught promise rejections from freezing the app
        }
      }
    },
    mutations: {
      meta: {
        onError: (error: unknown) => {
          console.error('Mutation error:', error);
          // This prevents uncaught promise rejections from freezing the app
        }
      }
    }
  },
  // Global error handler for unhandled errors
  queryCache: {
    onError: (error) => {
      console.error('Global query cache error:', error);
    },
  },
});

interface QueryProviderProps {
  children: React.ReactNode;
}

const QueryProvider = ({ children }: QueryProviderProps) => {
  // Add error boundary to catch React rendering errors
  React.useEffect(() => {
    // Add global unhandled promise rejection handler
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled Promise Rejection:', event.reason);
      // Prevent the app from freezing on uncaught promise rejections
      event.preventDefault();
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

export default QueryProvider;
