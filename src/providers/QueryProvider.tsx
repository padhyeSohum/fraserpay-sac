
import React from 'react';
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

const QueryProvider: React.FC<QueryProviderProps> = ({ children }) => {
  // Add global unhandled promise rejection handler
  React.useEffect(() => {
    // Function to handle unhandled rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled Promise Rejection:', event.reason);
      // Prevent the app from freezing on uncaught promise rejections
      event.preventDefault();
    };
    
    // Function to clear query cache
    const clearQueryCache = () => {
      // Invalidate all queries to force refetch
      queryClient.invalidateQueries();
    };
    
    // Add event listener for unhandled rejections
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    // Clear query cache initially
    clearQueryCache();
    
    // Set up interval to clear cache every 15 minutes
    const interval = setInterval(clearQueryCache, 15 * 60 * 1000);
    
    // Clean up function
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      clearInterval(interval);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

export default QueryProvider;
