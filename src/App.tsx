import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./providers/AuthProvider";
import { CartProvider } from "./contexts/CartContext";
import { RecoilRoot } from "recoil";
import Index from "./pages/Index";
import Login from "./pages/Login";

// Log the current environment
console.log('Current environment:', import.meta.env.MODE);

const queryClient = new QueryClient();

function App() {
  return (
    <RecoilRoot>
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <CartProvider>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
              </Routes>
              <Toaster />
            </CartProvider>
          </AuthProvider>
        </QueryClientProvider>
      </BrowserRouter>
    </RecoilRoot>
  );
}

export default App;