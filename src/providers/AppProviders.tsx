
import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { QueryProvider } from './QueryProvider';
import { AuthProvider } from '@/contexts/auth';
import { TransactionProvider } from '@/contexts/transactions';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as SonnerToaster } from 'sonner';

// App providers wrapper component
const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <Router>
      <QueryProvider>
        <AuthProvider>
          <TransactionProvider>
            {children}
            <Toaster />
            <SonnerToaster position="top-right" />
          </TransactionProvider>
        </AuthProvider>
      </QueryProvider>
    </Router>
  );
};

export default AppProviders;
