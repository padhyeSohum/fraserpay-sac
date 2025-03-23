
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/contexts/auth';
import { TransactionProvider } from '@/contexts/transactions';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import QueryProvider from './QueryProvider';

const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <React.StrictMode>
      <BrowserRouter>
        <ThemeProvider defaultTheme="light" storageKey="fraser-pay-theme">
          <QueryProvider>
            <AuthProvider>
              <TransactionProvider>
                {children}
                <Toaster richColors position="top-right" />
              </TransactionProvider>
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </BrowserRouter>
    </React.StrictMode>
  );
};

export default AppProviders;
