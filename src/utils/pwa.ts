
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
  setDeferredPrompt: (event: BeforeInstallPromptEvent | null) => void
) => {
  console.log("Setting up PWA install prompt event handler");
  
  // Store the install prompt event for later use
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    // Prevent Chrome 67 and earlier from automatically showing the prompt
    e.preventDefault();
    
    console.log("beforeinstallprompt event captured", e);
    
    // Store the event so it can be triggered later
    setDeferredPrompt(e as BeforeInstallPromptEvent);
    
    // Update UI to show the install button
    setCanInstall(true);
  });

  // When the app is successfully installed
  window.addEventListener('appinstalled', () => {
    console.log('Fraser Pay was installed');
    
    // Clear the deferred prompt
    setDeferredPrompt(null);
    
    // Hide the install button
    setCanInstall(false);
  });
  
  // If we're in a PWA already, don't show the install prompt
  if (isPWA()) {
    console.log("Already running as PWA, not showing install prompt");
    setCanInstall(false);
    return;
  }
};

// Show the install prompt
export const showInstallPrompt = async (deferredPrompt: BeforeInstallPromptEvent): Promise<boolean> => {
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

// Function to manually show the install banner after a delay
export const showInstallBanner = (setShowPWAPrompt: (show: boolean) => void, delay: number = 3000) => {
  // Only show on mobile devices that aren't already PWAs
  if (isPWA()) {
    console.log("Already in PWA mode, not showing install banner");
    return;
  }
  
  console.log("Setting up delayed PWA install banner");
  
  // Show the banner after a delay for better user experience
  const timer = setTimeout(() => {
    console.log("Showing PWA install banner now");
    setShowPWAPrompt(true);
  }, delay);
  
  return () => clearTimeout(timer);
};
