import { ProductSearch } from '@/components/ProductSearch';
import { CartProvider } from '@/contexts/CartContext';

const Products = () => {
  return (
    <CartProvider>
      <div className="container mx-auto py-8">
        <ProductSearch />
      </div>
    </CartProvider>
  );
};

export default Products;