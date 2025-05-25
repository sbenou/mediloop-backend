
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from '@/pages/Home';
import Login from '@/pages/Login';
import Signup from '@/pages/Signup';
import Dashboard from '@/pages/Dashboard';
import Settings from '@/pages/Settings';
import Profile from '@/pages/Profile';
import SearchDoctors from '@/pages/SearchDoctors';
import FindPharmacy from '@/pages/FindPharmacy';
import FindDoctor from '@/pages/FindDoctor';
import DoctorDashboard from '@/pages/DoctorDashboard';
import ProtectedRoute from '@/components/routing/ProtectedRoute';
import { QueryProvider } from '@/providers/QueryProvider';
import { TenantProvider } from '@/contexts/TenantContext';
import { FirebaseNotificationProvider } from '@/providers/FirebaseNotificationProvider';
import ProtectedDoctorDashboard from '@/router/roles/ProtectedDoctorDashboard';
import ProtectedPharmacyDashboard from '@/router/roles/ProtectedPharmacyDashboard';
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
            <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['patient', 'doctor', 'pharmacist', 'admin']}><Dashboard /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute allowedRoles={['patient', 'doctor', 'pharmacist', 'admin']}><Settings /></ProtectedRoute>} />
            <Route path="/profile/:id" element={<ProtectedRoute allowedRoles={['patient', 'doctor', 'pharmacist', 'admin']}><Profile /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute allowedRoles={['patient', 'doctor', 'pharmacist', 'admin']}><Profile /></ProtectedRoute>} />
            <Route path="/search-doctors" element={<ProtectedRoute allowedRoles={['patient']}><SearchDoctors /></ProtectedRoute>} />
            <Route path="/find-pharmacy" element={<ProtectedRoute allowedRoles={['patient']}><FindPharmacy /></ProtectedRoute>} />
            <Route path="/find-doctor" element={<ProtectedRoute allowedRoles={['patient']}><FindDoctor /></ProtectedRoute>} />
            
            {/* Role-based protected routes */}
            <Route path="/doctor-dashboard" element={<ProtectedDoctorDashboard />} />
            <Route path="/pharmacy-dashboard" element={<ProtectedPharmacyDashboard />} />
            
            {/* Test route for debugging notifications */}
            <Route path="/test-notifications" element={<TestNotifications />} />
          </Routes>
        </TenantProvider>
      </FirebaseNotificationProvider>
    </QueryProvider>
  );
};

export default AppRoutes;
