
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

// Function to check for service worker updates
const checkForUpdates = () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(registration => {
      registration.update();
    });
  }
};

// Create React root and render App with error handling
const rootElement = document.getElementById("root");
if (!rootElement) throw new Error('Failed to find the root element');

const root = createRoot(rootElement);

// Add global error handler
try {
  // Render app without React.StrictMode (it's now in AppProviders)
  root.render(<App />);
} catch (error) {
  handleRenderError(error as Error);
}

// Add global error handling
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  handleRenderError(event.error);
  // Prevent default browser error handling
  event.preventDefault();
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
  
  // Check for updates periodically (every hour)
  checkForUpdates();
  setInterval(checkForUpdates, 60 * 60 * 1000);
}

// Add support for custom domains
if (window.location.hostname === 'fraserpay.johnfrasersac.com') {
  // Set any custom domain specific configuration here if needed
  console.log('Fraser Pay running on custom domain');
  
  // You can add custom domain specific logic here if needed in the future
  document.title = 'Fraser Pay - JF SAC';
}
