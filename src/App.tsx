import { ProductSearch } from '@/components/ProductSearch';
import { CartProvider } from '@/contexts/CartContext';
import { CurrencyProvider } from '@/contexts/CurrencyContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AuthProvider from '@/providers/AuthProvider';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Products from './pages/Products';
import Home from './pages/Home';
import Login from './pages/Login';
import Admin from './pages/Admin';
import './App.css';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CurrencyProvider>
          <CartProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/products" element={<Products />} />
                <Route path="/login" element={<Login />} />
                <Route path="/admin" element={<Admin />} />
              </Routes>
            </BrowserRouter>
          </CartProvider>
        </CurrencyProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
