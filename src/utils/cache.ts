
// Function to clear cache on application start
export const clearBrowserCache = async () => {
  if ('caches' in window) {
    try {
      // Get all cache names
      const cacheNames = await caches.keys();
      
      // Delete all caches
      await Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)));
      
      console.log('Browser cache cleared successfully');
      return true;
    } catch (error) {
      console.error('Error clearing browser cache:', error);
      return false;
    }
  }
  return false;
};

// Function to clear all stored data
export const clearAppData = () => {
  try {
    // Clear application session storage
    sessionStorage.clear();
    
    // Store a flag to prevent clearing on every navigation
    localStorage.setItem('cacheCleared', Date.now().toString());
    
    return true;
  } catch (error) {
    console.error('Error clearing application data:', error);
    return false;
  }
};
