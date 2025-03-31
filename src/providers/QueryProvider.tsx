
import React, { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { getVersionedStorageItem, setVersionedStorageItem } from '@/utils/storageManager';

// Create a client with robust error handling that won't freeze the app
// Using longer staleTime and gcTime to reduce Firebase reads
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,   // Only refetch when explicitly requested
      refetchOnMount: true,          // Still refetch when component mounts
      refetchOnReconnect: false,     // Only refetch when explicitly requested
      staleTime: 5 * 60 * 1000,      // Data stays fresh for 5 minutes
      gcTime: 30 * 60 * 1000,        // Cache for 30 minutes (renamed from cacheTime)
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
  // Add global unhandled promise rejection handler outside of useEffect
  const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    console.error('Unhandled Promise Rejection:', event.reason);
    // Prevent the app from freezing on uncaught promise rejections
    event.preventDefault();
  };
  
  // Modify clear query cache to be more selective
  const clearQueryCache = () => {
    // Instead of invalidating all queries, only invalidate specific ones
    // based on what needs to be fresh vs what can stay cached longer
    
    // Critical data that should always be fresh
    queryClient.invalidateQueries({ queryKey: ['userBalance'] });
    queryClient.invalidateQueries({ queryKey: ['boothStats'] });
    queryClient.invalidateQueries({ queryKey: ['sacRevenue'] });
    
    // Use storage to record last full invalidation time
    const lastFullInvalidation = getVersionedStorageItem<number>('lastFullInvalidation', 0);
    const now = Date.now();
    
    // Only do a full invalidation every hour
    if (now - lastFullInvalidation > 60 * 60 * 1000) {
      queryClient.invalidateQueries();
      setVersionedStorageItem('lastFullInvalidation', now);
    }
  };

  // Only use useEffect in the component body, not conditionally
  useEffect(() => {
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    // Clear query cache initially
    clearQueryCache();
    // Set up interval to clear cache every 15 minutes for critical data only
    const interval = setInterval(clearQueryCache, 15 * 60 * 1000);
    
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
