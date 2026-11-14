import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { StoreProvider } from './store.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <StoreProvider>
      <App />
    </StoreProvider>
  </React.StrictMode>
);

// Offline support + "Add to Home Screen" (only in the real build).
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
}
