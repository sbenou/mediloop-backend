
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { RecoilRoot } from 'recoil';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CartProvider } from '@/contexts/CartContext';
import { CurrencyProvider } from '@/contexts/CurrencyContext';
import { AuthProvider } from '@/providers/AuthProvider';
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
import Products from './pages/Products';
import PharmacyDashboard from './pages/PharmacyDashboard';

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
const PharmacyProfile = () => <PlaceholderPage title="Pharmacy Profile" />;

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
                  <Route path="/" element={<Index />} />
                  <Route path="/home" element={<Home />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/superadmin/*" element={<SuperAdminDashboard />} />
                  <Route path="/search-pharmacy" element={<SearchPharmacy />} />
                  <Route path="/prescription" element={<Prescription />} />
                  <Route path="/create-prescription" element={<CreatePrescription />} />
                  <Route path="/edit-prescription/:id" element={<EditPrescription />} />
                  <Route path="/prescriptions/:id" element={<Prescription />} />
                  <Route path="/my-prescriptions" element={<MyPrescriptions />} />
                  <Route path="/my-prescriptions/:id" element={<Prescription />} />
                  <Route path="/teleconsultations" element={<Teleconsultations />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/admin-settings" element={<AdminSettings />} />
                  <Route path="/pharmacy" element={<PharmacyDashboard />} />
                  <Route path="/pharmacy/*" element={<PharmacyDashboard />} />
                  <Route path="/pharmacy/profile" element={<PharmacyProfile />} />
                  <Route path="/doctor/profile" element={<DoctorProfilePage />} />
                  <Route path="/doctor" element={<DoctorDashboard />} />
                  <Route path="/doctor/*" element={<DoctorDashboard />} />
                  <Route path="/search-pharmacy-test" element={<SearchPharmacyTest />} />
                  <Route path="/auth/confirm" element={<EmailConfirmationHandler />} />
                  <Route path="/products" element={<Products />} />
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
