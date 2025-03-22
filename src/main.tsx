
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Function to check for service worker updates
const checkForUpdates = () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(registration => {
      registration.update();
    });
  }
};

// Create React root and render App
createRoot(document.getElementById("root")!).render(<App />);

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
