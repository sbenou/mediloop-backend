
import React from 'react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { getCartTotal } from '@/utils/cartUtils';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/auth/useAuth';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { toast } from '@/components/ui/use-toast';

const CartFooter = () => {
  const { state } = useCart();
  const { formatCurrency } = useCurrency();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const supabase = useSupabaseClient();
  
  const cartTotal = getCartTotal(state.items);
  
  const handleCheckout = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please login to proceed with checkout",
        variant: "destructive",
      });
      navigate('/login');
      return;
    }
    
    if (state.items.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Please add items to your cart before checkout",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const { data, error } = await supabase.functions.invoke('create-delivery-payment', {
        body: {
          items: state.items,
          comment: ''
        }
      });
      
      if (error) throw error;
      
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast({
        title: "Checkout Failed",
        description: "There was a problem initiating checkout. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const handleViewCart = () => {
    navigate('/my-orders');
  };
  
  return (
    <div className="border-t pt-4">
      <div className="flex justify-between mb-4">
        <span className="font-medium">Total</span>
        <span className="font-bold">{formatCurrency(cartTotal)}</span>
      </div>
      
      <div className="space-y-2">
        <Button 
          className="w-full" 
          size="lg"
          onClick={handleCheckout}
        >
          Checkout
        </Button>
        
        <Button 
          variant="outline" 
          className="w-full" 
          size="lg"
          onClick={handleViewCart}
        >
          View Cart
        </Button>
      </div>
    </div>
  );
};

export default CartFooter;
