import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles.css';
import './mobile-fixes.css';
import './anise-flow-fixes.css';
import './ui-behavior.js';
import './prospect-ui-fixes.js';
import './redesign.css';

// ANISE Flow is a live CRM. Do not let an old service worker keep stale
// JavaScript/CSS in front of the current deployment.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(registration => registration.unregister()));
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(key => caches.delete(key)));
      }
    } catch (_) {
      // A cache cleanup failure must never prevent the CRM from rendering.
    }
  });
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
