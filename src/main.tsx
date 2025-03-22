
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

// Check for updates periodically (every hour)
if (import.meta.env.PROD) {
  checkForUpdates();
  setInterval(checkForUpdates, 60 * 60 * 1000);
}
