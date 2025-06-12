
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initializeI18n } from './i18n/config'

// Import auth toggle to ensure it's initialized
import './auth-v2/config/authToggle'

// Initialize i18n before rendering the app
initializeI18n();

console.log('main.tsx is executing - Initializing React application');

// Make sure we have a root element before trying to render
const rootElement = document.getElementById('root');

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
} else {
  console.error('Root element not found!');
}
