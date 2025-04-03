
import { ProductSearch } from '@/components/ProductSearch';
import { CartProvider } from '@/contexts/CartContext';
import { CurrencyProvider } from '@/contexts/CurrencyContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CountrySelector from '@/components/CountrySelector';
import { Routes, Route, useLocation } from 'react-router-dom';
import ProductDetail from './ProductDetail';

// Create a new QueryClient instance for this component
const queryClient = new QueryClient();

const Products = () => {
  const location = useLocation();
  const isDetailPage = location.pathname.split('/').length > 2;

  return (
    <QueryClientProvider client={queryClient}>
      <CurrencyProvider>
        <CartProvider>
          <div className="min-h-screen flex flex-col">
            <Header />
            <CountrySelector />
            <div className="container mx-auto py-8 flex-grow">
              <Routes>
                <Route path="/" element={<ProductSearch />} />
                <Route path=":id" element={<ProductDetail />} />
              </Routes>
            </div>
            <Footer />
          </div>
        </CartProvider>
      </CurrencyProvider>
    </QueryClientProvider>
  );
};

export default Products;
