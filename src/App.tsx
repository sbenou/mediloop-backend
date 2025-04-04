
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { RouterProvider } from "@/router/RouterProvider"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Suspense } from "react"
import { RecoilRoot } from "recoil";
import { AuthProvider } from "@/providers/AuthProvider";
import { CartProvider } from "@/contexts/CartContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { ActivityDataLoader } from "@/components/activity/ActivityDataLoader";

function App() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        refetchOnWindowFocus: false,
        staleTime: 5 * 60 * 1000, // 5 minutes
      },
    },
  });
  
  // Force development mode detection to ensure the data loader is always available
  const isDevelopmentMode = import.meta.env.DEV || import.meta.env.MODE === 'development';
  
  return (
    <div className="app">
      <RecoilRoot>
        <AuthProvider>
          <QueryClientProvider client={queryClient}>
            <CurrencyProvider>
              <CartProvider>
                <Suspense fallback={<div>Loading...</div>}>
                  <ThemeProvider
                    defaultTheme="light"
                    storageKey="vite-react-theme"
                  >
                    <RouterProvider />
                    <Toaster />
                    
                    {/* Always show the activity data loader in development */}
                    {isDevelopmentMode && (
                      <ActivityDataLoader />
                    )}
                  </ThemeProvider>
                </Suspense>
              </CartProvider>
            </CurrencyProvider>
          </QueryClientProvider>
        </AuthProvider>
      </RecoilRoot>
    </div>
  );
}

export default App;
