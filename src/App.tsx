
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { RouterProvider } from "@/router/RouterProvider"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Suspense } from "react"
import { TestDataLoader } from "@/components/testing/TestDataLoader";

function App() {
  const queryClient = new QueryClient()
  
  return (
    <div className="app">
      <QueryClientProvider client={queryClient}>
        <Suspense fallback={<div>Loading...</div>}>
          <ThemeProvider
            defaultTheme="system"
            storageKey="vite-react-theme"
          >
            <RouterProvider />
            <Toaster />
          </ThemeProvider>
        </Suspense>
      </QueryClientProvider>
      
      {/* Test Data Loader for development */}
      {import.meta.env.DEV && <TestDataLoader />}
    </div>
  );
}

export default App;
