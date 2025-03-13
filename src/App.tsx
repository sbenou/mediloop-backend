
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { RecoilRoot } from 'recoil';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CartProvider } from '@/contexts/CartContext';
import { CurrencyProvider } from '@/contexts/CurrencyContext';
import Home from './pages/Home';
import SearchPharmacyTest from './pages/SearchPharmacyTest';

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
const Login = () => <PlaceholderPage title="Login" />;
const Register = () => <PlaceholderPage title="Register" />;
const Dashboard = () => <PlaceholderPage title="Dashboard" />;
const AdminDashboard = () => <PlaceholderPage title="Admin Dashboard" />;
const SuperAdminDashboard = () => <PlaceholderPage title="Super Admin Dashboard" />;
const SearchPharmacy = () => <PlaceholderPage title="Search Pharmacy" />;
const Prescription = () => <PlaceholderPage title="Prescription" />;
const Settings = () => <PlaceholderPage title="Settings" />;
const AdminSettings = () => <PlaceholderPage title="Admin Settings" />;
const PharmacyProfile = () => <PlaceholderPage title="Pharmacy Profile" />;

function App() {
  return (
    <RecoilRoot>
      <QueryClientProvider client={queryClient}>
        <CurrencyProvider>
          <CartProvider>
            <Router>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/superadmin/*" element={<SuperAdminDashboard />} />
                <Route path="/search-pharmacy" element={<SearchPharmacy />} />
                <Route path="/prescription" element={<Prescription />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/admin-settings" element={<AdminSettings />} />
                <Route path="/pharmacy/profile" element={<PharmacyProfile />} />
                <Route path="/search-pharmacy-test" element={<SearchPharmacyTest />} />
              </Routes>
              <Toaster />
            </Router>
          </CartProvider>
        </CurrencyProvider>
      </QueryClientProvider>
    </RecoilRoot>
  );
}

export default App;
