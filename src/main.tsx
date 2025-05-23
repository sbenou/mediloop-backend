
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import { RecoilRoot } from "recoil";
import { I18nextProvider } from "react-i18next";
import i18n from "./i18n/config";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "sonner";
import AuthProvider from "./providers/AuthProvider";
import { ThemeProvider } from "@/components/theme-provider";
import "./index.css";

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: attempt => Math.min(attempt > 1 ? 2 ** attempt * 1000 : 1000, 30 * 1000),
      staleTime: 30000,
    },
  },
});

// Add explicit debug log to check if main.tsx is executing
console.log("main.tsx is executing - attempting to mount React application");

// Make sure the root element exists
const rootElement = document.getElementById("root");
if (!rootElement) {
  console.error("Failed to find the root element. DOM mounting point missing!");
} else {
  console.log("Root element found, mounting React application");
}

// Create root and render app
const root = ReactDOM.createRoot(rootElement as HTMLElement);

// Add explicit render log
console.log("Rendering React application to DOM");

root.render(
  <React.StrictMode>
    <RecoilRoot>
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider defaultTheme="light" storageKey="mediloop-theme">
            <I18nextProvider i18n={i18n}>
              <AuthProvider>
                {/* Add a direct debug element that should be visible regardless of styling issues */}
                <div style={{
                  position: 'fixed',
                  bottom: '40px',
                  left: '40px',
                  background: 'purple',
                  color: 'white',
                  padding: '10px',
                  zIndex: 100000,
                  fontWeight: 'bold'
                }}>
                  Debug: React Root Mounted
                </div>
                <App />
                <Toaster />
                <Sonner position="bottom-right" />
              </AuthProvider>
            </I18nextProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </BrowserRouter>
    </RecoilRoot>
  </React.StrictMode>
);

// Register service worker for Firebase notifications
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/firebase-messaging-sw.js')
      .then(registration => {
        console.log('Firebase SW registered:', registration);
      })
      .catch(error => {
        console.error('Firebase SW registration failed:', error);
      });
  });
}
