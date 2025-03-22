
import React from 'react';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Create a client with error handling that won't freeze the app
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 60000, // 1 minute
      onError: (error) => {
        console.error('Query error:', error);
        // This prevents uncaught promise rejections from freezing the app
      }
    },
    mutations: {
      onError: (error) => {
        console.error('Mutation error:', error);
        // This prevents uncaught promise rejections from freezing the app
      }
    }
  }
});

interface QueryProviderProps {
  children: React.ReactNode;
}

const QueryProvider = ({ children }: QueryProviderProps) => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

export default QueryProvider;
