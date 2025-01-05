import { ProductSearch } from '@/components/ProductSearch';
import { CartProvider } from '@/contexts/CartContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

const Products = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <CartProvider>
        <div className="container mx-auto py-8">
          <ProductSearch />
        </div>
      </CartProvider>
    </QueryClientProvider>
  );
};

export default Products;