
import React, { useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/contexts/auth';
import { TransactionProvider } from '@/contexts/transactions';
import { ThemeProvider } from '@/contexts/theme';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';
import AppRoutes from '@/routes/AppRoutes';

function App() {
  // Configure single toast notification settings globally
  useEffect(() => {
    // Add a global handler to prevent duplicate toasts
    // This will help us track shown toasts to prevent duplicates
    const shownToasts = new Set();
    
    // Override the console.error to prevent duplicate error toasts
    const originalConsoleError = console.error;
    console.error = (...args) => {
      // Get a string representation of the error
      const errorString = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ');
      
      // Only show toast if we haven't shown this exact error before
      if (!shownToasts.has(errorString)) {
        shownToasts.add(errorString);
        // After 5 seconds, remove from the set to allow the toast again
        setTimeout(() => {
          shownToasts.delete(errorString);
        }, 5000);
      }
      
      // Still log the original error to console
      originalConsoleError.apply(console, args);
    };
    
    return () => {
      // Restore original console.error when component unmounts
      console.error = originalConsoleError;
    };
  }, []);
  
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <TransactionProvider>
            <Toaster 
              position="top-right"
              toastOptions={{
                style: { 
                  background: 'white',
                  color: 'black',
                  border: '1px solid #e2e8f0'
                },
                duration: 4000
              }}
              closeButton
              richColors
            />
            <AppRoutes />
            <PWAInstallPrompt onClose={() => {}} />
          </TransactionProvider>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
