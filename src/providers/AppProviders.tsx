
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/contexts/auth';
import { TransactionProvider } from '@/contexts/transactions';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import QueryProvider from './QueryProvider';

// This component wraps all application providers in the correct order
const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ThemeProvider defaultTheme="light" storageKey="fraser-pay-theme">
      <QueryProvider>
        <BrowserRouter>
          <AuthProvider>
            <TransactionProvider>
              {children}
              <Toaster richColors position="top-right" />
            </TransactionProvider>
          </AuthProvider>
        </BrowserRouter>
      </QueryProvider>
    </ThemeProvider>
  );
};

export default AppProviders;
