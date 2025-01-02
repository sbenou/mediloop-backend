import { useParams } from 'react-router-dom';
import { ProductSearch } from '@/components/ProductSearch';

const Products = () => {
  const { pharmacyId } = useParams();

  return (
    <div className="container mx-auto py-8">
      <ProductSearch pharmacyId={pharmacyId} />
    </div>
  );
};

export default Products;