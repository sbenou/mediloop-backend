
import { ProductSearch } from '@/components/ProductSearch';
import { CartProvider } from '@/contexts/CartContext';
import { CurrencyProvider } from '@/contexts/CurrencyContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AuthProvider from '@/providers/AuthProvider';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster";
import { RecoilRoot } from "recoil";
import Index from "./pages/Index";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import Products from "./pages/Products";
import Services from "./pages/Services";
import Profile from "./pages/Profile";
import MyOrders from "./pages/MyOrders";
import MyPrescriptions from "./pages/MyPrescriptions";
import Settings from "./pages/Settings";
import AdminSettings from "./pages/AdminSettings";
import BecomePartner from "./pages/BecomePartner";
import BecomeTransporter from "./pages/BecomeTransporter";
import CreatePrescription from "./pages/CreatePrescription";
import DoctorConnections from "./pages/DoctorConnections";
import FindDoctor from "./pages/FindDoctor";
import SearchPharmacy from "./pages/SearchPharmacy";
import Signup from "./pages/Signup";
import { OTPVerificationPage } from "@/components/auth/login/OTPVerificationPage";
import Teleconsultations from "./pages/Teleconsultations";
import Billing from "./pages/Billing";
import EmailConfirmationHandler from "@/components/auth/EmailConfirmationHandler";
import './App.css';

// Log the current environment
console.log('Current environment:', import.meta.env.MODE);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <RecoilRoot>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <CurrencyProvider>
            <CartProvider>
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/login/verify" element={<OTPVerificationPage />} />
                  <Route path="/reset-password/*" element={<ResetPassword />} />
                  <Route path="/products" element={<Products />} />
                  <Route path="/services" element={<Services />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/my-orders" element={<MyOrders />} />
                  <Route path="/my-prescriptions" element={<MyPrescriptions />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/admin-settings" element={<AdminSettings />} />
                  <Route path="/become-partner" element={<BecomePartner />} />
                  <Route path="/become-transporter" element={<BecomeTransporter />} />
                  <Route path="/create-prescription" element={<CreatePrescription />} />
                  <Route path="/doctor-connections" element={<DoctorConnections />} />
                  <Route path="/find-doctor" element={<FindDoctor />} />
                  <Route path="/search-pharmacy" element={<SearchPharmacy />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/teleconsultations" element={<Teleconsultations />} />
                  <Route path="/billing" element={<Billing />} />
                  <Route path="/auth/confirm" element={<EmailConfirmationHandler />} />
                </Routes>
                <Toaster />
              </BrowserRouter>
            </CartProvider>
          </CurrencyProvider>
        </AuthProvider>
      </QueryClientProvider>
    </RecoilRoot>
  );
}

export default App;
