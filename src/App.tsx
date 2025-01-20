import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./providers/AuthProvider";
import { CartProvider } from "./contexts/CartContext";
import { RecoilRoot } from "recoil";
import Index from "./pages/Index";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import { OTPVerificationPage } from "@/components/auth/login/OTPVerificationPage";

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
                <Route path="/login/verify" element={<OTPVerificationPage />} />
                <Route path="/reset-password/*" element={<ResetPassword />} />
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