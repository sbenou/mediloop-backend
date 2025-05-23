
import { useState, useEffect } from 'react'
import './App.css'
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './AppRoutes';
import { RecoilRoot } from 'recoil';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/providers/AuthProvider';
import { ThemeProvider } from './components/theme-provider';
import { TenantProvider } from './contexts/TenantContext';

function App() {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes
        retry: 1,
      },
    },
  }));

  return (
    <RecoilRoot>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
          <AuthProvider>
            <TenantProvider>
              <BrowserRouter>
                <AppRoutes />
                <Toaster />
              </BrowserRouter>
            </TenantProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </RecoilRoot>
  );
}

export default App;
