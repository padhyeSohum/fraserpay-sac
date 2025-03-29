
import React, { useEffect, Suspense } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/contexts/auth';
import { TransactionProvider } from '@/contexts/transactions';
import { ThemeProvider } from '@/contexts/theme';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';
import AppRoutes from '@/routes/AppRoutes';
import { LoadingScreen } from '@/routes';

// Error boundary component to prevent the whole app from crashing
class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: Error | null}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("App error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-screen p-4">
          <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
          <p className="mb-4">The application encountered an error. Please refresh the page to try again.</p>
          <p className="text-sm text-gray-600 mb-4">
            {this.state.error?.message || 'Unknown error'}
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

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
    <ErrorBoundary>
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
              <Suspense fallback={<LoadingScreen timeout={false} />}>
                <AppRoutes />
              </Suspense>
              <PWAInstallPrompt onClose={() => {}} />
            </TransactionProvider>
          </AuthProvider>
        </ThemeProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
