
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

  useEffect(() => {
    // Prevent multiple initialization attempts
    if (initAttempted.current) return;
    initAttempted.current = true;
    
    // Initialize app in a controlled sequence
    const initializeApp = async () => {
      try {
        console.log('Starting app initialization...');
        
        // Step 1: Measure app performance
        measurePerformance();
        
        // Step 2: Preload critical resources
        await preloadCriticalResources([
          '/lovable-uploads/ed1f3f9a-22a0-42de-a8cb-354fb8c82dae.png'
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
    
    // Add a timeout to ensure the app always loads even if something hangs
    const fallbackTimer = setTimeout(() => {
      if (isInitializing) {
        console.warn('App initialization timeout reached. Forcing app to load.');
        setIsInitializing(false);
        setIsReady(true);
      }
    }, 5000); // 5 second timeout
    
    // Clean up function to prevent any potential memory leaks
    return () => {
      clearTimeout(fallbackTimer);
    };
  }, []); // Empty dependency array so it only runs once
  
  // Return null during initialization to avoid premature rendering
  if (!isReady) {
    return null;
  }
  
  return (
    <AppProviders>
      <AppRoutes />
    </AppProviders>
  );
};

export default App;
