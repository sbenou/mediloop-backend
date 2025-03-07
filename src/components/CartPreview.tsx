
import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { ShoppingCart } from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';
import CartItem from './cart/CartItem';
import CartFooter from './cart/CartFooter';

const CartPreview = () => {
  const { state } = useCart();
  
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b">
        <h2 className="text-lg font-semibold">Your Cart</h2>
        <p className="text-sm text-muted-foreground">
          {state.items.length} {state.items.length === 1 ? 'item' : 'items'}
        </p>
      </div>
      
      {state.items.length > 0 ? (
        <>
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {state.items.map((item) => (
                <CartItem key={item.id} item={item} />
              ))}
            </div>
          </ScrollArea>
          
          <div className="p-4 mt-auto">
            <CartFooter />
          </div>
        </>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
          <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Your cart is empty</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Looks like you haven't added any items to your cart yet.
          </p>
          <Button>Start Shopping</Button>
        </div>
      )}
    </div>
  );
};

export default CartPreview;
