
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';

interface AdjacentProduct {
  id: string;
  name: string;
}

interface ProductNavigationProps {
  prevProduct: AdjacentProduct | null;
  nextProduct: AdjacentProduct | null;
  onNavigate: (product: AdjacentProduct | null) => void;
  loading: boolean;
}

export const ProductNavigation = ({ 
  prevProduct, 
  nextProduct, 
  onNavigate, 
  loading 
}: ProductNavigationProps) => {
  const handleNavigation = (product: AdjacentProduct | null) => {
    if (product && !loading) {
      console.log(`Navigating to: ${product.id} - ${product.name}`);
      onNavigate(product);
    }
  };

  return (
    <div className="flex justify-between mt-8 pt-6 border-t">  {/* Added pt-6 and border-t for visual separation */}
      {prevProduct ? (
        <Button
          variant="outline"
          className="flex items-center gap-2 max-w-[45%]"
          onClick={() => handleNavigation(prevProduct)}
          disabled={loading}
        >
          <ArrowLeft className="h-4 w-4 flex-shrink-0" /> 
          <span className="truncate">{prevProduct.name}</span>
        </Button>
      ) : (
        <div></div> // Empty div to maintain flex layout when no previous product
      )}
      
      {nextProduct ? (
        <Button
          variant="outline"
          className="flex items-center gap-2 max-w-[45%]"
          onClick={() => handleNavigation(nextProduct)}
          disabled={loading}
        >
          <span className="truncate">{nextProduct.name}</span> 
          <ArrowRight className="h-4 w-4 flex-shrink-0" />
        </Button>
      ) : (
        <div></div> // Empty div to maintain flex layout when no next product
      )}
    </div>
  );
};
