
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
    element: <Dashboard />,
  },
  {
    path: '/doctor/dashboard',
    element: <DoctorDashboard />,
  },
  {
    path: '/universal-dashboard',
    element: <UniversalDashboard />,
  },
  {
    path: '/unauthorized',
    element: <UnauthorizedPage />,
  },
  {
    path: '/doctor/profile',
    element: <DoctorProfilePage />,
  },
  {
    path: '/pharmacy/profile',
    element: <PharmacyProfilePage />,
  },
  {
    path: '/notifications',
    element: <Activities initialView="notifications" />,
  },
  {
    path: '/activities',
    element: <Activities initialView="activities" />,
  },
  {
    path: '/upgrade',
    element: <UpgradePage />,
  },
  {
    path: '/my-orders',
    element: <MyOrders />,
  },
  {
    path: '/my-prescriptions',
    element: <MyPrescriptions />,
  },
  {
    path: '/account',
    element: <ProtectedAccountPage />,
  },
  {
    path: '/referral',
    element: <Referral />,
  },
  {
    path: '/settings',
    element: <Settings />,
  },
  {
    path: '*',
    element: <NotFound />,
  }
]);

export function RouterProvider() {
  return <ReactRouterProvider router={router} />;
}
