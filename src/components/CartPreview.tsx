import React, { useState, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { ShoppingCart } from 'lucide-react';
import { CartItem } from './cart/CartItem';
import CartFooter from './cart/CartFooter';
import { useNavigate } from 'react-router-dom';

const CartPreview = ({ onClose }: { onClose?: () => void }) => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<any[]>([]);
  
  try {
    // Try to use the cart context
    const { state } = useCart();
    
    // Update local state when the cart context changes
    useEffect(() => {
      if (state?.items) {
        setCartItems(state.items);
      }
    }, [state]);
  } catch (error) {
    // If outside of CartProvider, keep using the empty cartItems array
  }
  
  const handleStartShopping = () => {
    if (onClose) {
      onClose();
    }
    navigate('/products');
  };
  
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b">
        <h2 className="text-lg font-semibold">Your Cart</h2>
        <p className="text-sm text-muted-foreground">
          {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
        </p>
      </div>
      
      {cartItems.length > 0 ? (
        <>
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {cartItems.map((item) => (
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
          <Button onClick={handleStartShopping}>Start Shopping</Button>
        </div>
      )}
    </div>
  );
};

export default CartPreview;
