
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initializeI18n } from './i18n/config'

// Initialize i18n before rendering the app
initializeI18n();

// Add DOCTYPE declaration to fix quirks mode warning
// The rest of the document will be read from the index.html file

console.log('main.tsx is executing - Updated Lovable version');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
