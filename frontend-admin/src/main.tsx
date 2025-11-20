import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerServiceWorker, setupInstallPrompt } from './utils/pwa';

// Register service worker for PWA and push notifications
registerServiceWorker().then((registration) => {
  if (registration) {
    console.log('Service Worker registered successfully');
  }
}).catch((error) => {
  console.error('Service Worker registration failed:', error);
});

// Setup install prompt handler
setupInstallPrompt();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
