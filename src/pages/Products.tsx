
import { ProductSearch } from '@/components/ProductSearch';
import { CartProvider } from '@/contexts/CartContext';
import { CurrencyProvider } from '@/contexts/CurrencyContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Header from '@/components/layout/Header';
import CountrySelector from '@/components/CountrySelector';

const queryClient = new QueryClient();

const Products = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <CurrencyProvider>
        <CartProvider>
          <div>
            <Header />
            <CountrySelector />
            <div className="container mx-auto py-8">
              <ProductSearch />
            </div>
          </div>
        </CartProvider>
      </CurrencyProvider>
    </QueryClientProvider>
  );
};

export default Products;
