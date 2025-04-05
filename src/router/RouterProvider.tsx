
import { createBrowserRouter, RouterProvider as ReactRouterProvider, Navigate } from 'react-router-dom';
import Products from '@/pages/Products';
import Home from '@/pages/Home';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import DoctorDashboard from '@/pages/DoctorDashboard';
import UniversalDashboard from '@/pages/UniversalDashboard';
import UnauthorizedPage from '@/pages/UnauthorizedPage';
import DoctorProfilePage from '@/pages/doctor/DoctorProfilePage';
import Notifications from '@/pages/Notifications';
import Activities from '@/pages/Activities';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />,
  },
  {
    path: '/products',
    element: <Products />,
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
    path: '/notifications',
    element: <Navigate to="/dashboard?view=notifications" replace />,
  },
  {
    path: '/activities',
    element: <Activities />,
  }
]);

export function RouterProvider() {
  return <ReactRouterProvider router={router} />;
}
