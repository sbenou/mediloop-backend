import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RecoilRoot } from 'recoil';
import { Toaster } from "@/components/ui/toaster";
import { CartProvider } from "@/contexts/CartContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { AuthProvider } from "@/providers/AuthProvider";
import "@/i18n/config";
import Products from "@/pages/Products";
import Index from "@/pages/Index";
import Settings from "@/pages/Settings";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import MyOrders from "@/pages/MyOrders";
import MyPrescriptions from "@/pages/MyPrescriptions";
import CreatePrescription from "@/pages/CreatePrescription";
import FindDoctor from "@/pages/FindDoctor";
import DoctorConnections from "@/pages/DoctorConnections";
import AdminSettings from "@/pages/AdminSettings";
import ResetPassword from "@/pages/ResetPassword";
import Services from "@/pages/Services";
import BecomeTransporter from "@/pages/BecomeTransporter";
import BecomePartner from "@/pages/BecomePartner";
import SearchPharmacy from "@/pages/SearchPharmacy";
import EmailConfirmationHandler from "@/components/auth/EmailConfirmationHandler";
import Profile from "@/components/settings/Profile";
import { useAuth } from "@/hooks/auth/useAuth";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <RecoilRoot>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <CurrencyProvider>
            <CartProvider>
              <Router>
                <EmailConfirmationHandler />
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<Index />} />
                  <Route path="/search-pharmacy" element={<SearchPharmacy />} />
                  <Route path="/products" element={<Products />} />
                  <Route path="/products/:pharmacyId" element={<Products />} />
                  <Route path="/services" element={<Services />} />
                  <Route path="/become-transporter" element={<BecomeTransporter />} />
                  <Route path="/become-partner" element={<BecomePartner />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route 
                    path="/auth/callback" 
                    element={
                      <Navigate 
                        to="/reset-password" 
                        replace 
                        state={{ recovery: true }}
                      />
                    } 
                  />

                  {/* Protected Routes */}
                  <Route 
                    path="/settings" 
                    element={
                      <ProtectedRoute>
                        <Settings />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/my-details" 
                    element={
                      <ProtectedRoute>
                        <Profile />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/my-orders" 
                    element={
                      <ProtectedRoute>
                        <MyOrders />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/my-prescriptions" 
                    element={
                      <ProtectedRoute>
                        <MyPrescriptions />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/create-prescription" 
                    element={
                      <ProtectedRoute>
                        <CreatePrescription />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/find-doctor" 
                    element={
                      <ProtectedRoute>
                        <FindDoctor />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/doctor-connections" 
                    element={
                      <ProtectedRoute>
                        <DoctorConnections />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/admin-settings" 
                    element={
                      <ProtectedRoute>
                        <AdminSettings />
                      </ProtectedRoute>
                    } 
                  />
                </Routes>
                <Toaster />
              </Router>
            </CartProvider>
          </CurrencyProvider>
        </AuthProvider>
      </QueryClientProvider>
    </RecoilRoot>
  );
}

export default App;