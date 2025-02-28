
import { ProductSearch } from '@/components/ProductSearch';
import Header from '@/components/layout/Header';

const Products = () => {
  return (
    <div>
      <Header />
      <div className="container mx-auto py-8">
        <ProductSearch />
      </div>
    </div>
  );
};

export default Products;
