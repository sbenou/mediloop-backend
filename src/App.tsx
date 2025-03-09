import { ProductSearch } from '@/components/ProductSearch';
import { CartProvider } from '@/contexts/CartContext';
import { CurrencyProvider } from '@/contexts/CurrencyContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AuthProvider from '@/providers/AuthProvider';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster";
import { RecoilRoot } from "recoil";
import Index from "./pages/Index";
import Login from "./pages/Login";
import UniversalDashboard from "./pages/UniversalDashboard";
import ResetPassword from "./pages/ResetPassword";
import Products from "./pages/Products";
import Services from "./pages/Services";
import BecomePartner from "./pages/BecomePartner";
import BecomeTransporter from "./pages/BecomeTransporter";
import CreatePrescription from "./pages/CreatePrescription";
import DoctorConnections from "./pages/DoctorConnections";
import FindDoctor from "./pages/FindDoctor";
import SearchPharmacy from "./pages/SearchPharmacy";
import Signup from "./pages/Signup";
import { OTPVerificationPage } from "@/components/auth/login/OTPVerificationPage";
import EmailConfirmationHandler from "@/components/auth/EmailConfirmationHandler";
import UnifiedProfilePage from "./pages/UnifiedProfilePage";

// Pharmacy routes
import PharmacyDashboardOld from "./pages/pharmacy/PharmacyDashboardOld";
import PatientsPage from "./pages/pharmacy/PatientsPage";
import PatientDetail from "./pages/pharmacy/PatientDetail";
import OrdersPage from "./pages/pharmacy/OrdersPage";
import PrescriptionsPage from "./pages/pharmacy/PrescriptionsPage";
import PrescriptionDetail from "./pages/pharmacy/PrescriptionDetail";
import PharmacyProfile from "./pages/pharmacy/PharmacyProfile";

// Legacy pages - these will eventually be replaced
import Dashboard from "./pages/Dashboard";
import PatientDashboard from "./pages/PatientDashboard";

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
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CurrencyProvider>
          <CartProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                
                {/* Universal Dashboard - the new central dashboard for all roles */}
                <Route path="/dashboard" element={<UniversalDashboard />} />
                
                {/* UnifiedProfilePage - UI template (no authentication) */}
                <Route path="/unified-profile" element={<UnifiedProfilePage />} />
                
                {/* Legacy routes that redirect to the universal dashboard */}
                <Route path="/patient-dashboard" element={<Navigate to="/dashboard" replace />} />
                <Route path="/profile" element={<Navigate to="/dashboard?view=profile" replace />} />
                <Route path="/my-orders" element={<Navigate to="/dashboard?view=orders&ordersTab=orders" replace />} />
                <Route path="/my-prescriptions" element={<Navigate to="/dashboard?view=prescriptions" replace />} />
                <Route path="/settings" element={<Navigate to="/dashboard?view=settings" replace />} />
                <Route path="/billing" element={<Navigate to="/dashboard?view=billing" replace />} />
                <Route path="/teleconsultations" element={<Navigate to="/dashboard?view=teleconsultations" replace />} />
                
                {/* Authentication routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/login/verify" element={<OTPVerificationPage />} />
                <Route path="/reset-password/*" element={<ResetPassword />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/auth/confirm" element={<EmailConfirmationHandler />} />
                
                {/* General routes */}
                <Route path="/products" element={<Products />} />
                <Route path="/services" element={<Services />} />
                <Route path="/become-partner" element={<BecomePartner />} />
                <Route path="/become-transporter" element={<BecomeTransporter />} />
                <Route path="/create-prescription" element={<CreatePrescription />} />
                <Route path="/doctor-connections" element={<DoctorConnections />} />
                <Route path="/find-doctor" element={<FindDoctor />} />
                <Route path="/search-pharmacy" element={<SearchPharmacy />} />
                
                {/* Pharmacy routes */}
                <Route path="/pharmacy">
                  {/* Include both old and new dashboard */}
                  <Route path="dashboard-old" element={<PharmacyDashboardOld />} />
                  <Route path="dashboard" element={<Navigate to="/dashboard?view=pharmacy&section=dashboard" replace />} />
                  <Route path="patients" element={<Navigate to="/dashboard?view=pharmacy&section=patients" replace />} />
                  <Route path="orders" element={<Navigate to="/dashboard?view=pharmacy&section=orders" replace />} />
                  <Route path="prescriptions" element={<Navigate to="/dashboard?view=pharmacy&section=prescriptions" replace />} />
                  <Route path="profile" element={<PharmacyProfile />} />
                  
                  {/* Keep existing pharmacy pages for backward compatibility */}
                  <Route path="patients/:id" element={<PatientDetail />} />
                  <Route path="prescriptions/:id" element={<PrescriptionDetail />} />
                  <Route path="staff/:id" element={<PatientDetail />} />
                  <Route path="staff/:id/edit" element={<PatientDetail />} />
                </Route>
                
                {/* Legacy pages - will be removed in the future */}
                <Route path="/legacy/dashboard" element={<Dashboard />} />
                <Route path="/legacy/patient-dashboard" element={<PatientDashboard />} />
                <Route path="/legacy/unified-profile" element={<UnifiedProfilePage />} />
              </Routes>
              <Toaster />
            </BrowserRouter>
          </CartProvider>
        </CurrencyProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
