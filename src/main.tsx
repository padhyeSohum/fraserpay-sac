
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Error handling for React rendering errors
const handleRenderError = (error: Error) => {
  console.error('React render error:', error);
  // Display a user-friendly error message instead of freezing
  const rootElement = document.getElementById("root");
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="padding: 20px; text-align: center;">
        <h2>Something went wrong</h2>
        <p>The application encountered an error. Please refresh the page to try again.</p>
        <button onclick="window.location.reload()" style="padding: 8px 16px; cursor: pointer;">
          Refresh Page
        </button>
      </div>
    `;
  }
};

// Function to clear cache and check for service worker updates
const clearCacheAndCheckForUpdates = () => {
  if ('serviceWorker' in navigator) {
    // Clear cache on each visit
    navigator.serviceWorker.ready.then(registration => {
      // Send message to service worker to clear cache
      registration.active?.postMessage({ type: 'CLEAR_CACHE' });
      
      // Check for updates
      registration.update();
    });
    
    // Listen for cache cleared messages
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'CACHE_CLEARED') {
        console.log('Cache successfully cleared');
      }
    });
  }
};

// Function to safely mount the application
const mountApp = () => {
  // Get root element and verify it exists
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    console.error('Failed to find the root element');
    return;
  }

  // Create React root safely
  try {
    const root = createRoot(rootElement);
    
    // Render app with proper React context
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (error) {
    handleRenderError(error as Error);
  }
};

// Add global error handling
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  handleRenderError(event.error);
  // Prevent default browser error handling
  event.preventDefault();
});

// Handle SPA routing for direct URL access
if (window.location.pathname !== '/' && !window.location.pathname.includes('.')) {
  console.log('Direct URL access detected:', window.location.pathname);
}

// Force a cache bust for deployed environments
if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
  const timestamp = new Date().getTime();
  const scripts = document.getElementsByTagName('script');
  for (let i = 0; i < scripts.length; i++) {
    if (scripts[i].src && !scripts[i].src.includes('?')) {
      scripts[i].src = scripts[i].src + '?v=' + timestamp;
    }
  }
  
  const links = document.getElementsByTagName('link');
  for (let i = 0; i < links.length; i++) {
    if (links[i].rel === 'stylesheet' && links[i].href && !links[i].href.includes('?')) {
      links[i].href = links[i].href + '?v=' + timestamp;
    }
  }
}

// Initialize everything in a controlled sequence
document.addEventListener('DOMContentLoaded', () => {
  // Clear cache on initial load
  clearCacheAndCheckForUpdates();
  
  // Mount the application once DOM is fully ready
  mountApp();
});

// Register service worker for PWA support
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('Service Worker registered with scope:', registration.scope);
      })
      .catch(error => {
        console.error('Service Worker registration failed:', error);
      });
  });
  
  // Clear cache and check for updates periodically (every 15 minutes)
  clearCacheAndCheckForUpdates();
  setInterval(clearCacheAndCheckForUpdates, 15 * 60 * 1000);
}
