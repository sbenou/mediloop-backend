import React from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { RecoilRoot } from 'recoil';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CartProvider } from '@/contexts/CartContext';
import { CurrencyProvider } from '@/contexts/CurrencyContext';
import { AuthProvider } from '@/providers/AuthProvider';
import RequireRoleGuard from './components/auth/RequireRoleGuard';
import RequirePermissionGuard from './components/auth/RequirePermissionGuard';
import Index from './pages/Index';
import Home from './pages/Home';
import SearchPharmacyTest from './pages/SearchPharmacyTest';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Signup from './pages/Signup';
import UnauthorizedPage from './pages/UnauthorizedPage';
import NotFound from './pages/NotFound';
import EmailConfirmationHandler from './components/auth/EmailConfirmationHandler';
import CreatePrescription from './pages/CreatePrescription';
import MyPrescriptions from './pages/MyPrescriptions';
import Teleconsultations from './pages/Teleconsultations';
import DoctorProfilePage from './pages/doctor/DoctorProfilePage';
import PharmacyProfile from './pages/pharmacy/PharmacyProfile';
import Products from './pages/Products';
import { UserRole } from './types/role';
import DoctorDashboard from './pages/DoctorDashboard';
import UniversalDashboard from './pages/UniversalDashboard';
import AdminSettings from './pages/AdminSettings';
import SuperAdminDashboard from './pages/superadmin/SuperAdminDashboard';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Placeholder components for routes that don't have components yet
const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-2xl font-bold mb-4">{title} Page</h1>
      <p>This page is under construction.</p>
    </div>
  </div>
);

// Placeholder components for routes
const Register = () => <PlaceholderPage title="Register" />;
const AdminDashboard = () => <PlaceholderPage title="Admin Dashboard" />;
const SearchPharmacy = () => <PlaceholderPage title="Search Pharmacy" />;
const Prescription = () => <PlaceholderPage title="Prescription" />;
const EditPrescription = () => <PlaceholderPage title="Edit Prescription" />;
const Settings = () => <PlaceholderPage title="Settings" />;

function AppRoutes() {
  const location = useLocation();
  console.log('[App] Current route:', location.pathname);
  
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Index />} />
      <Route path="/index" element={<Index />} />
      <Route path="/home" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/auth/confirm" element={<EmailConfirmationHandler />} />
      <Route path="/products" element={<Products />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {/* Unified Dashboard route - handles redirects to appropriate dashboard */}
      <Route path="/dashboard" element={<Dashboard />} />
      
      {/* Doctor routes */}
      <Route 
        path="/doctor" 
        element={
          <RequireRoleGuard allowedRoles={[UserRole.Doctor]}>
            <DoctorDashboard />
          </RequireRoleGuard>
        } 
      />
      
      <Route
        path="/doctor/profile"
        element={
          <RequireRoleGuard allowedRoles={[UserRole.Doctor]}>
            <DoctorProfilePage />
          </RequireRoleGuard>
        }
      />
      
      {/* Pharmacy routes */}
      <Route
        path="/pharmacy"
        element={
          <RequireRoleGuard allowedRoles={[UserRole.Pharmacist]}>
            <UniversalDashboard />
          </RequireRoleGuard>
        }
      />
      
      <Route
        path="/pharmacy/profile"
        element={
          <RequireRoleGuard allowedRoles={[UserRole.Pharmacist]}>
            <PharmacyProfile />
          </RequireRoleGuard>
        }
      />
      
      {/* Patient route */}
      <Route
        path="/patient"
        element={
          <RequireRoleGuard allowedRoles={[UserRole.Patient]}>
            <UniversalDashboard />
          </RequireRoleGuard>
        }
      />
      
      <Route
        path="/superadmin/*"
        element={
          <RequirePermissionGuard requiredPermissions={["view_admin"]}>
            <SuperAdminDashboard />
          </RequirePermissionGuard>
        }
      />

      {/* Protected routes available to specific roles */}
      <Route
        path="/admin-settings"
        element={
          <RequirePermissionGuard requiredPermissions={["manage_roles", "manage_users"]}>
            <AdminSettings />
          </RequirePermissionGuard>
        }
      />
      
      <Route
        path="/create-prescription"
        element={
          <RequireRoleGuard allowedRoles={[UserRole.Doctor, UserRole.Pharmacist]}>
            <CreatePrescription />
          </RequireRoleGuard>
        }
      />
      
      <Route
        path="/my-prescriptions"
        element={
          <RequireRoleGuard allowedRoles={[UserRole.Patient, UserRole.Doctor, UserRole.Pharmacist]}>
            <MyPrescriptions />
          </RequireRoleGuard>
        }
      />
      
      <Route
        path="/teleconsultations"
        element={
          <RequireRoleGuard allowedRoles={[UserRole.Patient, UserRole.Doctor]}>
            <Teleconsultations />
          </RequireRoleGuard>
        }
      />
      
      {/* Other routes that should maintain their existing logic */}
      <Route path="/register" element={<Register />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/search-pharmacy" element={<SearchPharmacy />} />
      <Route path="/prescription" element={<Prescription />} />
      <Route path="/edit-prescription/:id" element={<EditPrescription />} />
      <Route path="/prescriptions/:id" element={<Prescription />} />
      <Route path="/my-prescriptions/:id" element={<Prescription />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/search-pharmacy-test" element={<SearchPharmacyTest />} />
      
      {/* Catch-all route for 404 errors */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function App() {
  return (
    <RecoilRoot>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <CurrencyProvider>
            <CartProvider>
              <Router>
                <AppRoutes />
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
