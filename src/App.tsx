
import React, { useEffect, useState, useRef } from 'react';
import AppProviders from "./providers/AppProviders";
import AppRoutes from "./routes/AppRoutes";
import { measurePerformance, registerConnectivityListeners, preloadCriticalResources } from './utils/performance';
import { toast } from 'sonner';

const App = () => {
  // Use useState for reactive state that triggers re-renders
  const [isReady, setIsReady] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  // Use useRef for tracking initialization attempts to prevent duplicate initialization
  const initAttempted = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Prevent multiple initialization attempts
    if (initAttempted.current) return;
    initAttempted.current = true;
    
    // Add a FALLBACK TIMER first to ensure the app always loads
    // This is the critical change to fix the loading issue
    timeoutRef.current = setTimeout(() => {
      console.warn('App initialization timeout reached. Forcing app to load.');
      setIsInitializing(false);
      setIsReady(true);
    }, 5000); // 5 second timeout

    // Initialize app in a controlled sequence
    const initializeApp = async () => {
      try {
        console.log('Starting app initialization...');
        
        // Step 1: Measure app performance
        measurePerformance();
        
        // Step 2: Preload critical resources
        await Promise.race([
          preloadCriticalResources([
            '/lovable-uploads/ed1f3f9a-22a0-42de-a8cb-354fb8c82dae.png'
          ]),
          new Promise(resolve => setTimeout(resolve, 2000)) // 2 second timeout for preloading
        ]);
        
        // Step 3: Register connectivity listeners
        registerConnectivityListeners(
          // Online callback
          () => {
            toast.success('You are back online!', {
              id: 'network-status',
              duration: 2000
            });
          },
          // Offline callback
          () => {
            toast.error('You are offline. Some features may be unavailable.', {
              id: 'network-status',
              duration: 5000
            });
          }
        );
        
        console.log('App initialization complete');
        // Cancel the fallback timer if initialization completes successfully
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        // Mark app as ready when initialization is complete
        setIsInitializing(false);
        setIsReady(true);
      } catch (error) {
        console.error('Failed to initialize app:', error);
        // Allow the app to render even if initialization fails
        setIsInitializing(false);
        setIsReady(true);
      }
    };
    
    initializeApp();
    
    // Clean up function to prevent any potential memory leaks
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []); // Clean dependency array
  
  // Return the app as soon as it's ready, don't block on loading
  return (
    <AppProviders>
      <AppRoutes />
    </AppProviders>
  );
};

export default App;
