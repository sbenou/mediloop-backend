
import { useState, useCallback, useMemo } from 'react';
import { useAtom } from 'jotai';
import { cartAtom, CartItem } from '@/store/cart';
import { useAuth } from '@/hooks/auth/useAuth';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import { toast } from '@/components/ui/use-toast';
import { sendPurchaseNotification } from '@/utils/notificationHelpers';

export const useCart = () => {
  const [cart, setCart] = useAtom(cartAtom);
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);
  const { user } = useAuth();

  // Calculate cart totals
  const cartTotal = useMemo(() => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  }, [cart]);
  
  const itemCount = useMemo(() => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  }, [cart]);

  // Add item to cart
  const addToCart = useCallback((item: Omit<CartItem, 'id' | 'quantity'>, quantity: number = 1) => {
    setCart(prev => {
      // Check if item already in cart
      const existingItemIndex = prev.findIndex(i => i.productId === item.productId);
      
      if (existingItemIndex >= 0) {
        // Update quantity of existing item
        const updatedCart = [...prev];
        updatedCart[existingItemIndex] = {
          ...updatedCart[existingItemIndex],
          quantity: updatedCart[existingItemIndex].quantity + quantity
        };
        return updatedCart;
      } else {
        // Add new item
        return [...prev, { ...item, id: uuidv4(), quantity }];
      }
    });
    
    toast({
      title: "Added to cart",
      description: `${item.name} has been added to your cart.`,
    });
  }, [setCart]);

  // Remove item from cart
  const removeFromCart = useCallback((id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  }, [setCart]);

  // Update item quantity
  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity < 1) return;
    
    setCart(prev => prev.map(item => 
      item.id === id ? { ...item, quantity } : item
    ));
  }, [setCart]);

  // Clear cart
  const clearCart = useCallback(() => {
    setCart([]);
  }, [setCart]);

  // Process order
  const processOrder = useCallback(async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to complete your purchase.",
        variant: "destructive",
      });
      return null;
    }
    
    if (cart.length === 0) {
      toast({
        title: "Empty cart",
        description: "Your cart is empty. Add items before checkout.",
        variant: "destructive",
      });
      return null;
    }
    
    try {
      setIsProcessingOrder(true);
      
      // Create order
      const orderId = uuidv4();
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          id: orderId,
          user_id: user.id,
          total: cartTotal,
          status: 'pending'
        })
        .select()
        .single();
      
      if (orderError) throw orderError;
      
      // Create order items
      const orderItems = cart.map(item => ({
        order_id: orderId,
        product_id: item.productId,
        quantity: item.quantity,
        price: item.price,
        name: item.name
      }));
      
      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);
      
      if (itemsError) throw itemsError;

      // Create notification in the app
      await sendPurchaseNotification(user.id, cartTotal, orderId);
      
      // Send confirmation email (this would be an edge function call)
      // For simplicity, we're just simulating this
      console.log('Sending order confirmation email for order:', orderId);
      
      // Clear cart after successful order
      clearCart();
      
      toast({
        title: "Order placed successfully",
        description: "Thank you for your purchase! You will receive a confirmation email shortly.",
      });
      
      return order;
    } catch (error) {
      console.error('Error processing order:', error);
      
      toast({
        title: "Order processing failed",
        description: "There was an error processing your order. Please try again.",
        variant: "destructive",
      });
      
      return null;
    } finally {
      setIsProcessingOrder(false);
    }
  }, [user, cart, cartTotal, clearCart]);

  return {
    cart,
    cartTotal,
    itemCount,
    isProcessingOrder,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    processOrder
  };
};
