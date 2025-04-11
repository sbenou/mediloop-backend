
import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import AppRoutes from './AppRoutes';
import { RecoilRoot } from 'recoil';
import { AuthInit } from './components/auth/AuthInit';
import { Toaster } from './components/ui/toaster';
import { AuthDebuggerSimple } from './components/auth/AuthDebuggerSimple';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a new QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  return (
    <RecoilRoot>
      <QueryClientProvider client={queryClient}>
        <Router>
          <AuthInit />
          <AuthDebuggerSimple />
          <AppRoutes />
          <Toaster />
        </Router>
      </QueryClientProvider>
    </RecoilRoot>
  );
}

export default App;
