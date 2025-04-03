
import { Button } from '@/components/ui/button';
import { ShoppingBag, ShoppingCart } from 'lucide-react';

interface ProductActionsProps {
  onAddToCart: () => void;
  onBuyNow: () => void;
  disabled: boolean;
}

export const ProductActions = ({ 
  onAddToCart, 
  onBuyNow, 
  disabled 
}: ProductActionsProps) => {
  return (
    <div className="pt-4 space-y-3">
      <Button 
        className="w-full flex items-center gap-2" 
        size="lg"
        onClick={onAddToCart}
        disabled={disabled}
      >
        <ShoppingCart className="h-5 w-5" />
        Add to Cart
      </Button>
      
      <Button 
        variant="outline" 
        className="w-full flex items-center gap-2" 
        size="lg"
        onClick={onBuyNow}
        disabled={disabled}
      >
        <ShoppingBag className="h-5 w-5" />
        Buy Now
      </Button>
      
      {disabled && (
        <p className="text-sm text-red-500 mt-2">
          This product requires a prescription and cannot be purchased directly.
        </p>
      )}
    </div>
  );
};
