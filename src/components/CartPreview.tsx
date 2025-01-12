import { ScrollArea } from "./ui/scroll-area";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "./ui/use-toast";
import { supabase } from "@/lib/supabase";
import { CartItem } from "./cart/CartItem";
import { CartEmpty } from "./cart/CartEmpty";
import { CartFooter } from "./cart/CartFooter";
import { useAuth } from "@/hooks/auth/useAuth";
import { useCartOperations } from "@/hooks/useCartOperations";

export const CartPreview = ({ onClose }: { onClose: () => void }) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { cart, removeFromCart, updateQuantity } = useCartOperations();
  const [comment, setComment] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const total = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleCheckout = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to proceed with checkout.",
      });
      onClose();
      navigate('/login');
      return;
    }

    try {
      setIsProcessing(true);
      
      console.log('Starting checkout process...');
      console.log('Cart items:', cart.items);
      
      const { data, error } = await supabase.functions.invoke('create-delivery-payment', {
        body: { 
          items: cart.items.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            image_url: item.image_url
          })),
          comment 
        }
      });

      console.log('Checkout response:', { data, error });

      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }

      if (!data?.url) {
        console.error('No checkout URL received');
        throw new Error('No checkout URL received from payment service');
      }

      window.location.href = data.url;
    } catch (error) {
      console.error('Detailed checkout error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to process checkout. Please try again.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (cart.items.length === 0) {
    return <CartEmpty />;
  }

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 -mx-6 px-6">
        <div className="space-y-4">
          {cart.items.map((item) => (
            <CartItem
              key={item.id}
              {...item}
              onUpdateQuantity={updateQuantity}
              onRemove={removeFromCart}
            />
          ))}
        </div>
      </ScrollArea>
      
      <CartFooter
        total={total}
        comment={comment}
        onCommentChange={setComment}
        onCheckout={handleCheckout}
        onClose={onClose}
        isProcessing={isProcessing}
      />
    </div>
  );
};