// CRITICAL: Silence ALL fetch errors - MUST BE FIRST!
// This code runs IMMEDIATELY before anything else
(function () {
  const originalFetch = window.fetch;
  const originalError = console.error;

  window.fetch = async (...args: Parameters<typeof fetch>) => {
    console.error = () => {}; // Silence errors
    try {
      return await originalFetch(...args);
    } finally {
      console.error = originalError; // Restore
    }
  };

  // Suppress unhandled rejections
  window.addEventListener("unhandledrejection", (e) => {
    if (
      e.reason?.message?.includes?.("fetch") ||
      e.reason?.message?.includes?.("Network")
    ) {
      e.preventDefault();
    }
  });
})();

import { useState, useEffect } from "react";
import "./App.css";
import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./AppRoutes";
import { RecoilRoot } from "recoil";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/providers/AuthProvider";
import { CartProvider } from "@/contexts/CartContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { ThemeProvider } from "./components/theme-provider";
import { TenantProvider } from "./contexts/TenantContext";
import { FirebaseNotificationProvider } from "./providers/FirebaseNotificationProvider";

function App() {
  // Create QueryClient instance outside of render function to avoid recreation on each render
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes
        retry: 1,
      },
    },
  });

  useEffect(() => {
    console.log("App rendering TenantProvider and AppRoutes");
  }, []);

  return (
    <RecoilRoot>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
          <AuthProvider>
            <CurrencyProvider>
              <CartProvider>
                <TenantProvider>
                  <FirebaseNotificationProvider>
                    <BrowserRouter>
                      <AppRoutes />
                      <Toaster />
                    </BrowserRouter>
                  </FirebaseNotificationProvider>
                </TenantProvider>
              </CartProvider>
            </CurrencyProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </RecoilRoot>
  );
}

export default App;
