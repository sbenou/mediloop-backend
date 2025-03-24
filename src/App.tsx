
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { RecoilRoot } from 'recoil';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CartProvider } from '@/contexts/CartContext';
import { CurrencyProvider } from '@/contexts/CurrencyContext';
import { AuthProvider } from '@/providers/AuthProvider';
import ProtectedRoute from './components/routing/ProtectedRoute';
import Index from './pages/Index';
import Home from './pages/Home';
import SearchPharmacyTest from './pages/SearchPharmacyTest';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Signup from './pages/Signup';
import EmailConfirmationHandler from './components/auth/EmailConfirmationHandler';
import CreatePrescription from './pages/CreatePrescription';
import MyPrescriptions from './pages/MyPrescriptions';
import Teleconsultations from './pages/Teleconsultations';
import DoctorDashboard from './pages/DoctorDashboard';
import DoctorProfilePage from './pages/doctor/DoctorProfilePage';
import PharmacyDashboardOld from './pages/pharmacy/PharmacyDashboardOld';
import PharmacyProfile from './pages/pharmacy/PharmacyProfile';
import Products from './pages/Products';
import UnauthorizedPage from './pages/UnauthorizedPage';
import { UserRole } from './types/role';

// Create a client for React Query
const queryClient = new QueryClient();

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
const SuperAdminDashboard = () => <PlaceholderPage title="Super Admin Dashboard" />;
const SearchPharmacy = () => <PlaceholderPage title="Search Pharmacy" />;
const Prescription = () => <PlaceholderPage title="Prescription" />;
const EditPrescription = () => <PlaceholderPage title="Edit Prescription" />;
const Settings = () => <PlaceholderPage title="Settings" />;
const AdminSettings = () => <PlaceholderPage title="Admin Settings" />;
const PatientDashboard = () => <PlaceholderPage title="Patient Dashboard" />;

// Custom DoctorProfile component that renders DoctorDashboard with profile params
const DoctorProfile = () => {
  // Set URL search params for profile view
  const searchParams = new URLSearchParams();
  searchParams.set('view', 'doctor');
  searchParams.set('section', 'profile');
  searchParams.set('profileTab', 'personal');
  
  // Pass these params to the DoctorDashboard component
  // The component will handle routing internally based on these params
  return <DoctorDashboard initialParams={searchParams} />;
};

function App() {
  return (
    <RecoilRoot>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <CurrencyProvider>
            <CartProvider>
              <Router>
                <Routes>
                  {/* Public routes */}
                  <Route path="/" element={<Index />} />
                  <Route path="/home" element={<Home />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/auth/confirm" element={<EmailConfirmationHandler />} />
                  <Route path="/products" element={<Products />} />
                  <Route path="/unauthorized" element={<UnauthorizedPage />} />

                  {/* Dashboard router - handles redirects to appropriate dashboard */}
                  <Route path="/dashboard" element={<Dashboard />} />
                  
                  {/* Role-specific protected routes */}
                  <Route
                    path="/doctor/*"
                    element={
                      <ProtectedRoute allowedRoles={[UserRole.Doctor]}>
                        <DoctorDashboard />
                      </ProtectedRoute>
                    }
                  />
                  
                  <Route
                    path="/doctor/profile"
                    element={
                      <ProtectedRoute allowedRoles={[UserRole.Doctor]}>
                        <DoctorProfilePage />
                      </ProtectedRoute>
                    }
                  />
                  
                  <Route
                    path="/pharmacy/*"
                    element={
                      <ProtectedRoute allowedRoles={[UserRole.Pharmacist]}>
                        <PharmacyDashboardOld />
                      </ProtectedRoute>
                    }
                  />
                  
                  <Route
                    path="/pharmacy/profile"
                    element={
                      <ProtectedRoute allowedRoles={[UserRole.Pharmacist]}>
                        <PharmacyProfile />
                      </ProtectedRoute>
                    }
                  />
                  
                  <Route
                    path="/superadmin/*"
                    element={
                      <ProtectedRoute allowedRoles={[UserRole.Superadmin]}>
                        <SuperAdminDashboard />
                      </ProtectedRoute>
                    }
                  />
                  
                  <Route
                    path="/patient-dashboard"
                    element={
                      <ProtectedRoute allowedRoles={[UserRole.Patient]}>
                        <PatientDashboard />
                      </ProtectedRoute>
                    }
                  />

                  {/* Protected routes available to specific roles */}
                  <Route
                    path="/admin-settings"
                    element={
                      <ProtectedRoute allowedRoles={[UserRole.Superadmin, "admin"]}>
                        <AdminSettings />
                      </ProtectedRoute>
                    }
                  />
                  
                  <Route
                    path="/create-prescription"
                    element={
                      <ProtectedRoute allowedRoles={[UserRole.Doctor, UserRole.Pharmacist]}>
                        <CreatePrescription />
                      </ProtectedRoute>
                    }
                  />
                  
                  <Route
                    path="/my-prescriptions"
                    element={
                      <ProtectedRoute allowedRoles={[UserRole.Patient, UserRole.Doctor, UserRole.Pharmacist]}>
                        <MyPrescriptions />
                      </ProtectedRoute>
                    }
                  />
                  
                  <Route
                    path="/teleconsultations"
                    element={
                      <ProtectedRoute allowedRoles={[UserRole.Patient, UserRole.Doctor]}>
                        <Teleconsultations />
                      </ProtectedRoute>
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
