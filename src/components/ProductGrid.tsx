import { ProductCard } from "./product/ProductCard";
import { ProductGridSkeleton } from "./product/ProductGridSkeleton";

interface Product {
  id: string;
  name: string;
  price: number;
  requires_prescription: boolean;
  type: 'medication' | 'parapharmacy';
  image_url?: string;
  description?: string;
}

interface ProductGridProps {
  products: Product[];
  isLoading: boolean;
  userRole?: string;
}

export const ProductGrid = ({ products, isLoading }: ProductGridProps) => {
  if (isLoading) {
    return <ProductGridSkeleton />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
};