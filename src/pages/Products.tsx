import { ProductSearch } from '@/components/ProductSearch';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Header from '@/components/layout/Header';

const queryClient = new QueryClient();

const Products = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <div>
        <Header />
        <div className="container mx-auto py-8">
          <ProductSearch />
        </div>
      </div>
    </QueryClientProvider>
  );
};

export default Products;