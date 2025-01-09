import { useCart } from "@/contexts/CartContext";
import { Button } from "./ui/button";
import { Minus, Plus, Trash2, ShoppingCart } from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";
import { Textarea } from "./ui/textarea";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "./ui/use-toast";
import { supabase } from "@/lib/supabase";

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
    return (
      <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
        <ShoppingCart className="h-12 w-12 mb-4" />
        <p>Your cart is empty</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 -mx-6 px-6">
        <div className="space-y-4">
          {cartState.items.map((item) => (
            <div key={item.id} className="flex items-center gap-4 py-4">
              {item.image_url && (
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="h-16 w-16 object-cover rounded"
                />
              )}
              <div className="flex-1">
                <h4 className="font-medium">{item.name}</h4>
                <p className="text-sm text-muted-foreground">${item.price}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-8 text-center">{item.quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="ml-2"
                  onClick={() => removeFromCart(item.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
      
      <div className="space-y-4 border-t pt-4 mt-4">
        <Textarea
          placeholder="Add a comment to your order..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="min-h-[100px]"
        />
        
        <div className="flex justify-between mb-4">
          <span className="font-medium">Total</span>
          <span className="font-medium">${total.toFixed(2)}</span>
        </div>
        
        <div className="space-y-2 pb-4">
          <Button 
            className="w-full" 
            onClick={handleCheckout}
            disabled={isProcessing}
          >
            {isProcessing ? "Processing..." : "Proceed to Checkout"}
          </Button>
          <Button 
            variant="outline" 
            className="w-full"
            onClick={onClose}
          >
            Keep Shopping
          </Button>
        </div>
      </div>
    </div>
  );
};