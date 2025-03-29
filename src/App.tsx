
import React, { useEffect, Suspense } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/contexts/auth';
import { TransactionProvider } from '@/contexts/transactions';
import { ThemeProvider } from '@/contexts/theme';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';
import AppRoutes from '@/routes/AppRoutes';
import { LoadingScreen } from '@/routes';

// Enhanced Error boundary component to prevent the whole app from crashing
class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: Error | null, errorInfo: React.ErrorInfo | null}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log the error for debugging
    console.error("App error:", error, errorInfo);
    this.setState({ errorInfo });

    // Log specific DOM-related errors
    if (error.message.includes("can not be found")) {
      console.warn("DOM-related error detected. This might be due to component unmounting issues.");
    }
  }

  handleRefresh = () => {
    // Clear session storage to force a clean state
    sessionStorage.clear();
    
    // Reload the page
    window.location.reload();
  }

  handleHomeRedirect = () => {
    // Clear session storage
    sessionStorage.clear();
    
    // Navigate home
    window.location.href = '/';
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
          <div className="w-full max-w-md p-6 bg-card rounded-lg shadow-lg">
            <h2 className="text-xl font-bold mb-2 text-foreground">Something went wrong</h2>
            
            <p className="mb-4 text-muted-foreground">
              The application encountered an error. Please try refreshing the page.
            </p>
            
            <div className="bg-muted/40 p-4 rounded-md mb-4 overflow-auto max-h-[200px]">
              <p className="text-sm font-mono text-destructive whitespace-pre-wrap break-all">
                {this.state.error?.message || 'Unknown error'}
              </p>
            </div>
            
            <div className="space-y-3">
              <button 
                onClick={this.handleRefresh} 
                className="w-full px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
              >
                Refresh Page
              </button>
              
              <button 
                onClick={this.handleHomeRedirect}
                className="w-full px-4 py-2 bg-secondary text-secondary-foreground rounded hover:bg-secondary/90 transition-colors"
              >
                Go to Home Page
              </button>
            </div>
          </div>
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
    
    // Add global error handler for all unhandled errors
    const handleGlobalError = (event: ErrorEvent) => {
      console.error("Unhandled global error:", event.error);
      
      // Prevent the default browser error overlay
      if (event.preventDefault) {
        event.preventDefault();
      }
    };
    
    window.addEventListener('error', handleGlobalError);
    
    return () => {
      // Restore original console.error when component unmounts
      console.error = originalConsoleError;
      window.removeEventListener('error', handleGlobalError);
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
