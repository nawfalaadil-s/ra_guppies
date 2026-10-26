import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Register PWA Service Worker for installable mobile home-screen experience
if ('serviceWorker' in navigator && typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        console.info('[RA Guppy PWA] Service Worker registered:', reg.scope);
      })
      .catch((err) => {
        console.warn('[RA Guppy PWA] Service Worker registration skipped:', err);
      });
  });
}

