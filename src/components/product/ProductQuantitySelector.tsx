
import { Button } from '@/components/ui/button';
import { Minus, Plus } from 'lucide-react';

interface ProductQuantitySelectorProps {
  quantity: number;
  onQuantityChange: (amount: number) => void;
}

export const ProductQuantitySelector = ({ 
  quantity, 
  onQuantityChange 
}: ProductQuantitySelectorProps) => {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-3">Quantity</h2>
      <div className="flex items-center w-32 h-12 border rounded-md">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onQuantityChange(-1)}
          disabled={quantity <= 1}
          className="h-full"
        >
          <Minus className="h-4 w-4" />
        </Button>
        <div className="flex-1 text-center font-medium">
          {quantity}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onQuantityChange(1)}
          className="h-full"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
