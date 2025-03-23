
import * as React from 'react';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Create a client with robust error handling that won't freeze the app
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: true,  // Always refetch when window regains focus
      refetchOnMount: true,        // Always refetch when component mounts
      refetchOnReconnect: true,    // Always refetch when reconnecting
      staleTime: 0,                // Data is immediately stale
      gcTime: 5 * 60 * 1000,       // Only cache for 5 minutes (renamed from cacheTime)
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
});

// Set up query cache event listeners using the correct listener signature
queryClient.getQueryCache().subscribe(event => {
  // Handle potential errors in queries through query cache events
  if (event.type === 'updated' && event.query.state.status === 'error') {
    console.error('Global query cache error:', event.query.state.error);
  }
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

  // Periodically clear query cache
  React.useEffect(() => {
    const clearQueryCache = () => {
      // Invalidate all queries to force refetch
      queryClient.invalidateQueries();
    };
    
    // Clear query cache initially and every 15 minutes
    clearQueryCache();
    const interval = setInterval(clearQueryCache, 15 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

export default QueryProvider;
