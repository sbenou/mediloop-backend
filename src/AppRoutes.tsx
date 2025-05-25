import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from '@/pages/Home';
import Login from '@/pages/Login';
import Signup from '@/pages/Signup';
import Dashboard from '@/pages/Dashboard';
import Settings from '@/pages/Settings';
import Profile from '@/pages/Profile';
import EditProfile from '@/pages/EditProfile';
import SearchDoctors from '@/pages/SearchDoctors';
import FindPharmacy from '@/pages/FindPharmacy';
import FindDoctor from '@/pages/FindDoctor';
import DoctorDashboard from '@/pages/DoctorDashboard';
import PharmacyDashboard from '@/pages/PharmacyDashboard';
import AdminDashboard from '@/pages/AdminDashboard';
import ProtectedRoute from '@/components/routing/ProtectedRoute';
import { QueryProvider } from '@/providers/QueryProvider';
import { TenantProvider } from '@/contexts/TenantContext';
import { FirebaseNotificationProvider } from '@/providers/FirebaseNotificationProvider';
import TestComponent from '@/components/TestComponent';
import ProtectedDoctorDashboard from '@/router/roles/ProtectedDoctorDashboard';
import ProtectedPharmacyDashboard from '@/router/roles/ProtectedPharmacyDashboard';
import ProtectedAdminDashboard from '@/router/roles/ProtectedAdminDashboard';
import TestNotifications from '@/pages/TestNotifications';

const AppRoutes = () => {
  return (
    <QueryProvider>
      <FirebaseNotificationProvider>
        <TenantProvider>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/profile/:id" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/edit-profile" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
            <Route path="/search-doctors" element={<ProtectedRoute><SearchDoctors /></ProtectedRoute>} />
            <Route path="/find-pharmacy" element={<ProtectedRoute><FindPharmacy /></ProtectedRoute>} />
            <Route path="/find-doctor" element={<ProtectedRoute><FindDoctor /></ProtectedRoute>} />
            <Route path="/test" element={<ProtectedRoute><TestComponent /></ProtectedRoute>} />
            
            {/* Role-based protected routes */}
            <Route path="/doctor-dashboard" element={<ProtectedDoctorDashboard />} />
            <Route path="/pharmacy-dashboard" element={<ProtectedPharmacyDashboard />} />
            <Route path="/admin-dashboard" element={<ProtectedAdminDashboard />} />
            
            {/* Test route for debugging notifications */}
            <Route path="/test-notifications" element={<TestNotifications />} />
          </Routes>
        </TenantProvider>
      </FirebaseNotificationProvider>
    </QueryProvider>
  );
};

export default AppRoutes;
