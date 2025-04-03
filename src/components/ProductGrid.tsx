
import { Product } from "./product/types/product";
import { ProductCard } from "./product/ProductCard";
import { ProductGridSkeleton } from "./product/ProductGridSkeleton";
import { Link, useLocation } from "react-router-dom";

interface ProductGridProps {
  products: Product[];
  isLoading: boolean;
  userRole?: string;
}

export const ProductGrid = ({ products, isLoading, userRole }: ProductGridProps) => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const sortOrder = queryParams.get('sort') || 'newest';

  if (isLoading) {
    return <ProductGridSkeleton />;
  }

  if (products.length === 0) {
    return (
      <div className="py-12 text-center border rounded-lg">
        <h2 className="text-xl font-semibold mb-2">No products found</h2>
        <p className="text-muted-foreground">Try adjusting your filters or search terms</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {products.map((product) => (
        <Link 
          key={product.id} 
          to={`/products/${product.id}?sort=${sortOrder}`}
          className="no-underline"
        >
          <ProductCard product={product} userRole={userRole} />
        </Link>
      ))}
    </div>
  );
};
