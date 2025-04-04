
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { RouterProvider } from "@/router/RouterProvider"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Suspense } from "react"
import { TestDataLoader } from "@/components/testing/TestDataLoader";
import { RecoilRoot } from "recoil";
import { AuthProvider } from "@/providers/AuthProvider";
import { CartProvider } from "@/contexts/CartContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";

function App() {
  const queryClient = new QueryClient()
  
  return (
    <div className="app">
      <RecoilRoot>
        <AuthProvider>
          <QueryClientProvider client={queryClient}>
            <CurrencyProvider>
              <CartProvider>
                <Suspense fallback={<div>Loading...</div>}>
                  <ThemeProvider
                    defaultTheme="system"
                    storageKey="vite-react-theme"
                  >
                    <RouterProvider />
                    <Toaster />
                  </ThemeProvider>
                </Suspense>
              </CartProvider>
            </CurrencyProvider>
          </QueryClientProvider>
        </AuthProvider>
      </RecoilRoot>
      
      {/* Test Data Loader for development */}
      {import.meta.env.DEV && <TestDataLoader />}
    </div>
  );
}

export default App;
