import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Loader } from 'lucide-react';
import ProtectedRoute from './components/routing/ProtectedRoute';
import RequireRoleGuard from './components/auth/RequireRoleGuard';
import RequirePermissionGuard from './components/auth/RequirePermissionGuard';
import { useAuth } from './hooks/auth/useAuth';
import { useTenant } from './contexts/TenantContext';

const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Profile = lazy(() => import('./pages/Profile'));
const AuthCallback = lazy(() => import('./pages/AuthCallback'));
const EmailConfirmation = lazy(() => import('./pages/EmailConfirmation'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Products = lazy(() => import('./pages/Products'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Orders = lazy(() => import('./pages/Orders'));
const Prescriptions = lazy(() => import('./pages/Prescriptions'));
const Settings = lazy(() => import('./pages/Settings'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));
const TestNotifications = lazy(() => import('./pages/TestNotifications'));
const DoctorDashboard = lazy(() => import('./pages/doctor/DoctorDashboard'));
const PharmacyDashboard = lazy(() => import('./pages/pharmacy/PharmacyDashboard'));
const SuperAdminDashboard = lazy(() => import('./pages/superadmin/SuperAdminDashboard'));
const DoctorAvailabilityPage = lazy(() => import('./pages/doctor/DoctorAvailabilityPage'));
const TeleconsultationPage = lazy(() => import('./pages/TeleconsultationPage'));
const TestLuxembourg = lazy(() => import('./pages/TestLuxembourg'));

const AppRoutes = () => {
  const { profile } = useAuth();
  const { tenant } = useTenant();

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
        path="/auth/confirm"
        element={
          <Suspense fallback={<Loader className="h-6 w-6 animate-spin" />}>
            <EmailConfirmation />
          </Suspense>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <Suspense fallback={<Loader className="h-6 w-6 animate-spin" />}>
            <ForgotPassword />
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
          <ProtectedRoute>
            <Suspense fallback={<Loader className="h-6 w-6 animate-spin" />}>
              <Dashboard />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Suspense fallback={<Loader className="h-6 w-6 animate-spin" />}>
              <Profile />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path="/products"
        element={
          <ProtectedRoute>
            <Suspense fallback={<Loader className="h-6 w-6 animate-spin" />}>
              <Products />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path="/products/:id"
        element={
          <ProtectedRoute>
            <Suspense fallback={<Loader className="h-6 w-6 animate-spin" />}>
              <ProductDetail />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path="/orders"
        element={
          <ProtectedRoute>
            <Suspense fallback={<Loader className="h-6 w-6 animate-spin" />}>
              <Orders />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path="/prescriptions"
        element={
          <ProtectedRoute>
            <Suspense fallback={<Loader className="h-6 w-6 animate-spin" />}>
              <Prescriptions />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Suspense fallback={<Loader className="h-6 w-6 animate-spin" />}>
              <Settings />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <RequireRoleGuard roles={['superadmin']}>
              <Suspense fallback={<Loader className="h-6 w-6 animate-spin" />}>
                <AdminPanel />
              </Suspense>
            </RequireRoleGuard>
          </ProtectedRoute>
        }
      />
      <Route
        path="/test-notifications"
        element={
          <ProtectedRoute>
            <RequirePermissionGuard permissions={['view_admin']}>
              <Suspense fallback={<Loader className="h-6 w-6 animate-spin" />}>
                <TestNotifications />
              </Suspense>
            </RequirePermissionGuard>
          </ProtectedRoute>
        }
      />
      <Route
        path="/doctor/dashboard"
        element={
          <ProtectedRoute>
            <RequireRoleGuard roles={['doctor']}>
              <Suspense fallback={<Loader className="h-6 w-6 animate-spin" />}>
                <DoctorDashboard />
              </Suspense>
            </RequireRoleGuard>
          </ProtectedRoute>
        }
      />
      <Route
        path="/pharmacy/dashboard"
        element={
          <ProtectedRoute>
            <RequireRoleGuard roles={['pharmacist']}>
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
          <ProtectedRoute>
            <RequireRoleGuard roles={['superadmin']}>
              <Suspense fallback={<Loader className="h-6 w-6 animate-spin" />}>
                <SuperAdminDashboard />
              </Suspense>
            </RequireRoleGuard>
          </ProtectedRoute>
        }
      />
      <Route
        path="/doctor/availability"
        element={
          <ProtectedRoute>
            <RequireRoleGuard roles={['doctor']}>
              <Suspense fallback={<Loader className="h-6 w-6 animate-spin" />}>
                <DoctorAvailabilityPage />
              </Suspense>
            </RequireRoleGuard>
          </ProtectedRoute>
        }
      />
      <Route
        path="/teleconsultation/:roomId"
        element={
          <ProtectedRoute>
            <Suspense fallback={<Loader className="h-6 w-6 animate-spin" />}>
              <TeleconsultationPage />
            </Suspense>
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
