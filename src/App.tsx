import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import SuperAdminDashboard from './pages/superadmin/SuperAdminDashboard';
import SearchPharmacy from './pages/SearchPharmacy';
import Prescription from './pages/Prescription';
import Settings from './pages/Settings';
import AdminSettings from './pages/admin/AdminSettings';
import PharmacyProfile from './pages/pharmacy/PharmacyProfile';
import SearchPharmacyTest from './pages/SearchPharmacyTest';

function App() {
  return (
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
        
        {/* Add the new SearchPharmacyTest route */}
        <Route path="/search-pharmacy-test" element={<SearchPharmacyTest />} />
        
      </Routes>
      <Toaster />
    </Router>
  );
}

export default App;
