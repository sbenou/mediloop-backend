
import { createBrowserRouter, RouterProvider as ReactRouterProvider } from 'react-router-dom';
import Products from '@/pages/Products';
import Home from '@/pages/Home';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />,
  },
  {
    path: '/products',
    element: <Products />,
  },
]);

export function RouterProvider() {
  return <ReactRouterProvider router={router} />;
}
