
import React from 'react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { getCartTotal } from '@/utils/cartUtils';

const CartFooter = () => {
  const { state } = useCart();
  const { formatCurrency } = useCurrency();
  
  const cartTotal = getCartTotal(state.items);
  
  return (
    <div className="border-t pt-4">
      <div className="flex justify-between mb-4">
        <span className="font-medium">Total</span>
        <span className="font-bold">{formatCurrency(cartTotal)}</span>
      </div>
      
      <div className="space-y-2">
        <Button className="w-full" size="lg">
          Checkout
        </Button>
        
        <Button variant="outline" className="w-full" size="lg">
          View Cart
        </Button>
      </div>
    </div>
  );
};

export default CartFooter;
