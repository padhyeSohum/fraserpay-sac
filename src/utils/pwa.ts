
// Check if the app is installed as PWA
export const isPWA = (): boolean => {
  return window.matchMedia('(display-mode: standalone)').matches || 
         (window.navigator as any).standalone === true;
};

// Check if the app can be installed (not already installed and on a compatible browser)
export const canInstallPWA = (): boolean => {
  return !isPWA() && 'serviceWorker' in navigator && 'BeforeInstallPromptEvent' in window;
};

// This function can be used in components to show an install button
export const setupInstallPrompt = (
  setCanInstall: (value: boolean) => void,
  setDeferredPrompt: (event: any) => void
) => {
  // Store the install prompt event for later use
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent Chrome 67 and earlier from automatically showing the prompt
    e.preventDefault();
    // Store the event so it can be triggered later
    setDeferredPrompt(e);
    // Update UI to show the install button
    setCanInstall(true);
  });

  // When the app is successfully installed
  window.addEventListener('appinstalled', () => {
    // Clear the deferred prompt
    setDeferredPrompt(null);
    // Hide the install button
    setCanInstall(false);
    console.log('Fraser Pay was installed');
  });
};

// Show the install prompt
export const showInstallPrompt = async (deferredPrompt: any): Promise<boolean> => {
  if (!deferredPrompt) {
    console.log('No deferred prompt available to show');
    return false;
  }

  try {
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    console.log(`PWA install prompt outcome: ${outcome}`);
    
    // Return true if installed, false otherwise
    return outcome === 'accepted';
  } catch (error) {
    console.error('Error showing PWA install prompt:', error);
    return false;
  }
};
