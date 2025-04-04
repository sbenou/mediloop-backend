
import { createBrowserRouter, RouterProvider as ReactRouterProvider } from 'react-router-dom';
import Products from '@/pages/Products';
import Home from '@/pages/Home';
import Login from '@/pages/Login';

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
]);

export function RouterProvider() {
  return <ReactRouterProvider router={router} />;
}
