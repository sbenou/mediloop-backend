
import { ThemeProvider } from "./components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
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
            {/* We need to implement RouterProvider before we can use it */}
            <div className="p-4">
              <h1 className="text-2xl font-bold mb-4">Welcome to the application</h1>
              <p>This is a placeholder until we add proper routing.</p>
            </div>
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
