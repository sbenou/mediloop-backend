
import React from 'react';
import { createBrowserRouter, RouterProvider as ReactRouterProvider, Navigate, Outlet } from 'react-router-dom';
import Products from '@/pages/Products';
import ProductDetail from '@/pages/ProductDetail';
import Home from '@/pages/Home';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import DoctorDashboard from '@/pages/DoctorDashboard';
import UniversalDashboard from '@/pages/UniversalDashboard';
import UnauthorizedPage from '@/pages/UnauthorizedPage';
import DoctorProfilePage from '@/pages/doctor/DoctorProfilePage';
import PharmacyProfilePage from '@/pages/pharmacy/PharmacyProfile';
import Activities from '@/pages/Activities';
import NotFound from '@/pages/NotFound';
import UpgradePage from '@/pages/upgrade/UpgradePage';
import MyOrders from '@/pages/MyOrders';
import MyPrescriptions from '@/pages/MyPrescriptions';
import Account from '@/pages/Account';
import { CartProvider } from '@/contexts/CartContext';
import { CurrencyProvider } from '@/contexts/CurrencyContext';
import Referral from '@/pages/Referral';
import Settings from '@/pages/Settings';
import RequireRoleGuard from '@/components/auth/RequireRoleGuard';
import ManageBoostsPage from '@/pages/ManageBoostsPage';
import BillingDetails from "@/pages/BillingDetails";
import ProtectedRoute from "@/components/routing/ProtectedRoute";

// Create a wrapper component for products routes that provides context
const ProductsLayout = () => {
  return (
    <CurrencyProvider>
      <CartProvider>
        <Outlet />
      </CartProvider>
    </CurrencyProvider>
  );
};

// Protected account page for specific roles
const ProtectedAccountPage = () => (
  <RequireRoleGuard allowedRoles={['patient', 'doctor', 'pharmacist', 'superadmin']}>
    <Account />
  </RequireRoleGuard>
);

// Protected manage boosts page for professionals
const ProtectedManageBoostsPage = () => (
  <RequireRoleGuard allowedRoles={['doctor', 'pharmacist']}>
    <ManageBoostsPage />
  </RequireRoleGuard>
);

// Wrap with protected route for auth check
const ProtectedDashboard = () => (
  <ProtectedRoute allowedRoles={['patient', 'doctor', 'pharmacist', 'superadmin']}>
    <Dashboard />
  </ProtectedRoute>
);

const ProtectedDoctorDashboard = () => (
  <ProtectedRoute allowedRoles={['doctor', 'superadmin']}>
    <DoctorDashboard />
  </ProtectedRoute>
);

const ProtectedUniversalDashboard = () => (
  <ProtectedRoute allowedRoles={['patient', 'doctor', 'pharmacist', 'superadmin']}>
    <UniversalDashboard />
  </ProtectedRoute>
);

const ProtectedDoctorProfilePage = () => (
  <ProtectedRoute allowedRoles={['doctor', 'superadmin']}>
    <DoctorProfilePage />
  </ProtectedRoute>
);

const ProtectedPharmacyProfilePage = () => (
  <ProtectedRoute allowedRoles={['pharmacist', 'superadmin']}>
    <PharmacyProfilePage />
  </ProtectedRoute>
);

const ProtectedActivities = ({ initialView }: { initialView: string }) => (
  <ProtectedRoute allowedRoles={['patient', 'doctor', 'pharmacist', 'superadmin']}>
    <Activities initialView={initialView} />
  </ProtectedRoute>
);

const ProtectedUpgradePage = () => (
  <ProtectedRoute allowedRoles={['patient', 'doctor', 'pharmacist']}>
    <UpgradePage />
  </ProtectedRoute>
);

const ProtectedMyOrders = () => (
  <ProtectedRoute allowedRoles={['patient', 'doctor', 'pharmacist']}>
    <MyOrders />
  </ProtectedRoute>
);

const ProtectedMyPrescriptions = () => (
  <ProtectedRoute allowedRoles={['patient', 'doctor']}>
    <MyPrescriptions />
  </ProtectedRoute>
);

const ProtectedReferral = () => (
  <ProtectedRoute allowedRoles={['patient', 'doctor', 'pharmacist']}>
    <Referral />
  </ProtectedRoute>
);

const ProtectedSettings = () => (
  <ProtectedRoute allowedRoles={['patient', 'doctor', 'pharmacist', 'superadmin']}>
    <Settings />
  </ProtectedRoute>
);

const ProtectedBillingDetails = () => (
  <ProtectedRoute allowedRoles={['patient', 'doctor', 'pharmacist']}>
    <BillingDetails />
  </ProtectedRoute>
);

const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />,
  },
  {
    path: '/products',
    element: <ProductsLayout />,
    children: [
      {
        index: true,
        element: <Products />,
      },
      {
        path: ':id',
        element: <ProductDetail />,
      }
    ]
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/dashboard',
    element: <ProtectedDashboard />,
  },
  {
    path: '/doctor/dashboard',
    element: <ProtectedDoctorDashboard />,
  },
  {
    path: '/universal-dashboard',
    element: <ProtectedUniversalDashboard />,
  },
  {
    path: '/unauthorized',
    element: <UnauthorizedPage />,
  },
  {
    path: '/doctor/profile',
    element: <ProtectedDoctorProfilePage />,
  },
  {
    path: '/pharmacy/profile',
    element: <ProtectedPharmacyProfilePage />,
  },
  {
    path: '/notifications',
    element: <ProtectedActivities initialView="notifications" />,
  },
  {
    path: '/activities',
    element: <ProtectedActivities initialView="activities" />,
  },
  {
    path: '/upgrade',
    element: <ProtectedUpgradePage />,
  },
  {
    path: '/my-orders',
    element: <ProtectedMyOrders />,
  },
  {
    path: '/my-prescriptions',
    element: <ProtectedMyPrescriptions />,
  },
  {
    path: '/account',
    element: <ProtectedAccountPage />,
  },
  {
    path: '/referral',
    element: <ProtectedReferral />,
  },
  {
    path: '/settings',
    element: <ProtectedSettings />,
  },
  {
    path: '/manage-boosts',
    element: <ProtectedManageBoostsPage />,
  },
  {
    path: '/billing-details',
    element: <ProtectedBillingDetails />,
  },
  {
    path: '*',
    element: <NotFound />,
  }
]);

export function RouterProvider() {
  return <ReactRouterProvider router={router} />;
}
