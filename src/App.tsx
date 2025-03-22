
import React, { useEffect } from 'react';
import AppProviders from "./providers/AppProviders";
import AppRoutes from "./routes/AppRoutes";
import { measurePerformance, registerConnectivityListeners, preloadCriticalResources } from './utils/performance';
import { toast } from 'sonner';

const App = () => {
  useEffect(() => {
    // Measure app performance
    measurePerformance();
    
    // Register connectivity listeners
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
    
    // Preload critical resources
    preloadCriticalResources([
      '/lovable-uploads/ed1f3f9a-22a0-42de-a8cb-354fb8c82dae.png'
    ]);
  }, []);
  
  return (
    <AppProviders>
      <AppRoutes />
    </AppProviders>
  );
};

export default App;
