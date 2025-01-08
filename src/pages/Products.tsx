import { ProductSearch } from '@/components/ProductSearch';
import { CartProvider } from '@/contexts/CartContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Header from '@/components/layout/Header';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

const queryClient = new QueryClient();

const Products = () => {
  const { data: session } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      return session;
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <CartProvider>
        <div>
          <Header session={session} />
          <div className="container mx-auto py-8">
            <ProductSearch />
          </div>
        </div>
      </CartProvider>
    </QueryClientProvider>
  );
};

export default Products;