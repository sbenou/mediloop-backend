
import { useState, useEffect } from 'react'
import './App.css'
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './AppRoutes';
import { RecoilRoot } from 'recoil';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from "@/components/ui/toaster";
import { AuthProviderWithRecoil } from '@/contexts/AuthContext'; // ✅ Changed from legacy to hybrid
import { CartProvider } from '@/contexts/CartContext';
import { CurrencyProvider } from '@/contexts/CurrencyContext';
import { ThemeProvider } from './components/theme-provider';
import { TenantProvider } from './contexts/TenantContext';
import { FirebaseNotificationProvider } from './providers/FirebaseNotificationProvider';

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
    console.log('App rendering with Hybrid AuthProvider (V2 + Legacy support)');
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
        <AuthProviderWithRecoil>
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
        </AuthProviderWithRecoil>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
