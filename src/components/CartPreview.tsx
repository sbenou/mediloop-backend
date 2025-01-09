import { useCart } from "@/contexts/CartContext";
import { ScrollArea } from "./ui/scroll-area";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "./ui/use-toast";
import { supabase } from "@/lib/supabase";
import { CartItem } from "./cart/CartItem";
import { CartEmpty } from "./cart/CartEmpty";
import { CartFooter } from "./cart/CartFooter";

export const CartPreview = ({ onClose, session }: { onClose: () => void, session: any }) => {
  const navigate = useNavigate();
  const { state: cartState, removeFromCart, updateQuantity } = useCart();
  const [comment, setComment] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const total = cartState.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleCheckout = async () => {
    if (!session) {
      toast({
        title: "Authentication Required",
        description: "Please create an account to proceed with checkout.",
      });
      navigate('/signup');
      return;
    }

    try {
      setIsProcessing(true);
      const { data, error } = await supabase.functions.invoke('create-delivery-payment', {
        body: { items: cartState.items, comment }
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to process checkout. Please try again.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (cartState.items.length === 0) {
    return <CartEmpty />;
  }

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 -mx-6 px-6">
        <div className="space-y-4">
          {cartState.items.map((item) => (
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