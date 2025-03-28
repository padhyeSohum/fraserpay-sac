
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
    <BrowserRouter>
      <QueryProvider>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <AuthProvider>
            <TransactionProvider>
              {children}
              <Toaster richColors position="top-right" />
            </TransactionProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryProvider>
    </BrowserRouter>
  );
};

export default AppProviders;
