
import React from 'react';
import { RouterProvider } from '@/router/RouterProvider';
import { AuthProviderWithRecoil as AuthProvider } from '@/contexts/AuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from "@/components/ui/toaster"

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
