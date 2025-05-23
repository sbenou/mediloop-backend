
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
import { FirebaseNotificationProvider } from './providers/FirebaseNotificationProvider';

function App() {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes
        retry: 1,
      },
    },
  }));

  useEffect(() => {
    console.log('App rendering TenantProvider and AppRoutes');
  }, []);

  return (
    <RecoilRoot>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
          <AuthProvider>
            <TenantProvider>
              <FirebaseNotificationProvider>
                <BrowserRouter>
                  <AppRoutes />
                  <Toaster />
                </BrowserRouter>
              </FirebaseNotificationProvider>
            </TenantProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </RecoilRoot>
  );
}

export default App;
