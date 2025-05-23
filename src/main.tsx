
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

// Create a client for React Query with simplified configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 10000,
    },
  },
});

console.log("main.tsx is executing - Updated Lovable version");

const rootElement = document.getElementById("root");
if (!rootElement) {
  console.error("Failed to find the root element");
} else {
  const root = ReactDOM.createRoot(rootElement);

  root.render(
    <React.StrictMode>
      <RecoilRoot>
        <BrowserRouter>
          <QueryClientProvider client={queryClient}>
            <ThemeProvider defaultTheme="light" storageKey="mediloop-theme">
              <I18nextProvider i18n={i18n}>
                <AuthProvider>
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
}

// Simplified service worker registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/firebase-messaging-sw.js').catch(error => {
      console.error('Firebase SW registration failed:', error);
    });
  });
}
