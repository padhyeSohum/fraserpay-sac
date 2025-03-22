
import React, { useEffect, useState } from 'react';
import AppProviders from "./providers/AppProviders";
import AppRoutes from "./routes/AppRoutes";
import { measurePerformance, registerConnectivityListeners, preloadCriticalResources } from './utils/performance';
import { toast } from 'sonner';

const App = () => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Initialize app in a controlled sequence
    const initializeApp = async () => {
      try {
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
        
        // Mark app as ready when initialization is complete
        setIsReady(true);
      } catch (error) {
        console.error('Failed to initialize app:', error);
        // Allow the app to render even if initialization fails
        setIsReady(true);
      }
    };
    
    initializeApp();
    
    // Clean up function to prevent any potential memory leaks
    return () => {
      // Any cleanup needed
    };
  }, []);
  
  // Only render the app once initialization is complete
  if (!isReady) {
    return null; // Return null during initialization to avoid premature rendering
  }
  
  return (
    <AppProviders>
      <AppRoutes />
    </AppProviders>
  );
};

export default App;
