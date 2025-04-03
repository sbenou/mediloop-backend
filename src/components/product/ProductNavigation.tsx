
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
  return (
    <div className="flex justify-between mt-6">
      <Button
        variant="outline"
        className="flex items-center gap-2 max-w-[45%]"
        onClick={() => onNavigate(prevProduct)}
        disabled={!prevProduct || loading}
      >
        <ArrowLeft className="h-4 w-4 flex-shrink-0" /> 
        <span className="truncate">
          {prevProduct ? prevProduct.name : 'Previous Product'}
        </span>
      </Button>
      <Button
        variant="outline"
        className="flex items-center gap-2 max-w-[45%]"
        onClick={() => onNavigate(nextProduct)}
        disabled={!nextProduct || loading}
      >
        <span className="truncate">
          {nextProduct ? nextProduct.name : 'Next Product'}
        </span> 
        <ArrowRight className="h-4 w-4 flex-shrink-0" />
      </Button>
    </div>
  );
};
