
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
import ProtectedAccountPage from './roles/ProtectedAccountPage';
import ProtectedManageBoostsPage from './roles/ProtectedManageBoostsPage';
import ProtectedDashboard from './roles/ProtectedDashboard';
import ProtectedDoctorDashboard from './roles/ProtectedDoctorDashboard';
import ProtectedUniversalDashboard from './roles/ProtectedUniversalDashboard';
import ProtectedDoctorProfilePage from './roles/ProtectedDoctorProfilePage';
import ProtectedPharmacyProfilePage from './roles/ProtectedPharmacyProfilePage';
import ProtectedActivities from './roles/ProtectedActivities';
import ProtectedUpgradePage from './roles/ProtectedUpgradePage';
import ProtectedMyOrders from './roles/ProtectedMyOrders';
import ProtectedMyPrescriptions from './roles/ProtectedMyPrescriptions';
import ProtectedReferral from './roles/ProtectedReferral';
import ProtectedSettings from './roles/ProtectedSettings';
import ProtectedBillingDetails from './roles/ProtectedBillingDetails';
import ProtectedPharmacyDashboard from './roles/ProtectedPharmacyDashboard';
import PatientsPage from '@/pages/pharmacy/PatientsPage';
import ProtectedPharmacyPatientsPage from './roles/ProtectedPharmacyPatientsPage';
import FindDoctor from '@/pages/FindDoctor';

// Wrapper component that injects Currency and Cart context to products routes
const ProductsLayout = () => (
  <CurrencyProvider>
    <CartProvider>
      <Outlet />
    </CartProvider>
  </CurrencyProvider>
);

// Type for initialView props accepted by ProtectedActivities
type ActivitiesView = 'notifications' | 'activities';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />,
  },
  {
    path: '/products',
    element: <ProductsLayout />,
    children: [
      { index: true, element: <Products /> },
      { path: ':id', element: <ProductDetail /> },
    ],
  },
  { path: '/login', element: <Login /> },
  { path: '/dashboard', element: <ProtectedDashboard /> },
  { path: '/doctor/dashboard', element: <ProtectedDoctorDashboard /> },
  { path: '/universal-dashboard', element: <ProtectedUniversalDashboard /> },
  { path: '/unauthorized', element: <UnauthorizedPage /> },
  { path: '/doctor/profile', element: <ProtectedDoctorProfilePage /> },
  { path: '/pharmacy/profile', element: <ProtectedPharmacyProfilePage /> },
  { path: '/pharmacy/dashboard', element: <ProtectedPharmacyDashboard /> },
  { path: '/pharmacy/patients', element: <ProtectedPharmacyPatientsPage /> },
  { path: '/pharmacy/patients/:id', element: <ProtectedPharmacyPatientsPage /> },
  { path: '/doctors', element: <FindDoctor /> },
  { path: '/find-doctor', element: <FindDoctor /> }, // Add this route as an alias
  {
    path: '/notifications',
    element: <ProtectedActivities initialView="notifications" />,
  },
  {
    path: '/activities',
    element: <ProtectedActivities initialView="activities" />,
  },
  { path: '/upgrade', element: <ProtectedUpgradePage /> },
  { path: '/my-orders', element: <ProtectedMyOrders /> },
  { path: '/my-prescriptions', element: <ProtectedMyPrescriptions /> },
  { path: '/account', element: <ProtectedAccountPage /> },
  { path: '/referral', element: <ProtectedReferral /> },
  { path: '/settings', element: <ProtectedSettings /> },
  { path: '/manage-boosts', element: <ProtectedManageBoostsPage /> },
  { path: '/billing-details', element: <ProtectedBillingDetails /> },
  { path: '*', element: <NotFound /> },
]);

export function RouterProvider() {
  return <ReactRouterProvider router={router} />;
}
