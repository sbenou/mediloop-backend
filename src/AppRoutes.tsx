
import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Loader } from 'lucide-react';
import ProtectedRoute from './components/routing/ProtectedRoute';
import RequireRoleGuard from './components/auth/RequireRoleGuard';
import RequirePermissionGuard from './components/auth/RequirePermissionGuard';
import { useAuth } from './hooks/auth/useAuth';

const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Profile = lazy(() => import('./pages/Profile'));
const AuthCallback = lazy(() => import('./pages/AuthCallback'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Products = lazy(() => import('./pages/Products'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Settings = lazy(() => import('./pages/Settings'));
const TestNotifications = lazy(() => import('./pages/TestNotifications'));
const PharmacyDashboard = lazy(() => import('./pages/pharmacy/PharmacyDashboard'));
const SuperAdminDashboard = lazy(() => import('./pages/superadmin/SuperAdminDashboard'));
const TestLuxembourg = lazy(() => import('./pages/TestLuxembourg'));

const AppRoutes = () => {
  const { profile } = useAuth();

  return (
    <Routes>
      <Route
        path="/"
        element={
          <Suspense fallback={<Loader className="h-6 w-6 animate-spin" />}>
            <Home />
          </Suspense>
        }
      />
      <Route
        path="/login"
        element={
          <Suspense fallback={<Loader className="h-6 w-6 animate-spin" />}>
            <Login />
          </Suspense>
        }
      />
      <Route
        path="/signup"
        element={
          <Suspense fallback={<Loader className="h-6 w-6 animate-spin" />}>
            <Signup />
          </Suspense>
        }
      />
      <Route
        path="/auth/callback"
        element={
          <Suspense fallback={<Loader className="h-6 w-6 animate-spin" />}>
            <AuthCallback />
          </Suspense>
        }
      />
      <Route
        path="/reset-password"
        element={
          <Suspense fallback={<Loader className="h-6 w-6 animate-spin" />}>
            <ResetPassword />
          </Suspense>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={['patient', 'doctor', 'pharmacist', 'superadmin']}>
            <Suspense fallback={<Loader className="h-6 w-6 animate-spin" />}>
              <Dashboard />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute allowedRoles={['patient', 'doctor', 'pharmacist', 'superadmin']}>
            <Suspense fallback={<Loader className="h-6 w-6 animate-spin" />}>
              <Profile />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path="/products"
        element={
          <ProtectedRoute allowedRoles={['patient', 'doctor', 'pharmacist', 'superadmin']}>
            <Suspense fallback={<Loader className="h-6 w-6 animate-spin" />}>
              <Products />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path="/products/:id"
        element={
          <ProtectedRoute allowedRoles={['patient', 'doctor', 'pharmacist', 'superadmin']}>
            <Suspense fallback={<Loader className="h-6 w-6 animate-spin" />}>
              <ProductDetail />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute allowedRoles={['patient', 'doctor', 'pharmacist', 'superadmin']}>
            <Suspense fallback={<Loader className="h-6 w-6 animate-spin" />}>
              <Settings />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path="/test-notifications"
        element={
          <ProtectedRoute allowedRoles={['superadmin']}>
            <RequirePermissionGuard requiredPermissions={['view_admin']}>
              <Suspense fallback={<Loader className="h-6 w-6 animate-spin" />}>
                <TestNotifications />
              </Suspense>
            </RequirePermissionGuard>
          </ProtectedRoute>
        }
      />
      <Route
        path="/pharmacy/dashboard"
        element={
          <ProtectedRoute allowedRoles={['pharmacist']}>
            <RequireRoleGuard requiredRoles={['pharmacist']}>
              <Suspense fallback={<Loader className="h-6 w-6 animate-spin" />}>
                <PharmacyDashboard />
              </Suspense>
            </RequireRoleGuard>
          </ProtectedRoute>
        }
      />
      <Route
        path="/superadmin/dashboard"
        element={
          <ProtectedRoute allowedRoles={['superadmin']}>
            <RequireRoleGuard requiredRoles={['superadmin']}>
              <Suspense fallback={<Loader className="h-6 w-6 animate-spin" />}>
                <SuperAdminDashboard />
              </Suspense>
            </RequireRoleGuard>
          </ProtectedRoute>
        }
      />
      
      {/* Add test route for Luxembourg functionality */}
      <Route path="/test-luxembourg" element={<TestLuxembourg />} />
      
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default AppRoutes;
