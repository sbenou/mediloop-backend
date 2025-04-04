
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { RouterProvider } from "@/router/RouterProvider"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Suspense } from "react"
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
                    defaultTheme="light"
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
      
      {/* Test Data Loader removed */}
    </div>
  );
}

export default App;
