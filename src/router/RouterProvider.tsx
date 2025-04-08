
import { createBrowserRouter, RouterProvider as ReactRouterProvider } from 'react-router-dom';
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
import { CartProvider } from '@/contexts/CartContext';
import { CurrencyProvider } from '@/contexts/CurrencyContext';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />,
  },
  {
    path: '/products',
    element: <CartProvider><CurrencyProvider><Products /></CurrencyProvider></CartProvider>,
  },
  {
    path: '/products/:id',
    element: <CartProvider><CurrencyProvider><ProductDetail /></CurrencyProvider></CartProvider>,
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
    element: <Activities />,
  },
  {
    path: '/activities',
    element: <Activities />,
  },
  {
    path: '*',
    element: <NotFound />,
  }
]);

export function RouterProvider() {
  return <ReactRouterProvider router={router} />;
}
