
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

// Register service worker for Firebase notifications
if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('/firebase-messaging-sw.js')
    .then(registration => {
      console.log('Firebase SW registered:', registration);
    })
    .catch(error => {
      console.error('Firebase SW registration failed:', error);
    });
}

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

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
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
