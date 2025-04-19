
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import CartPreview from "@/components/CartPreview";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/hooks/auth/useAuth";
import { useEffect, useState } from "react";
import { getCartCount } from "@/utils/cartUtils"; // Import the utility function

interface CartButtonProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const CartButton = ({ isOpen, onOpenChange }: CartButtonProps) => {
  // Use a try/catch to prevent errors when used outside a CartProvider
  const [itemCount, setItemCount] = useState(0);
  
  try {
    const { state } = useCart();
    // Use the utility function to calculate item count
    useEffect(() => {
      if (state?.items) {
        const count = getCartCount(state.items);
        setItemCount(count);
      }
    }, [state]);
  } catch (error) {
    // If using outside a CartProvider context, silently handle the error
    // Already using itemCount initialized as 0
  }

  const { isAuthenticated } = useAuth();

  // Listen for custom closeCart event
  useEffect(() => {
    const handleCloseCart = () => {
      onOpenChange(false);
    };
    
    window.addEventListener('closeCart', handleCloseCart);
    return () => {
      window.removeEventListener('closeCart', handleCloseCart);
    };
  }, [onOpenChange]);

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <Button 
        variant="outline" 
        size="icon" 
        className="relative"
        onClick={() => onOpenChange(true)}
      >
        <ShoppingCart className="h-4 w-4" />
        {itemCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-[#7E69AB] text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {itemCount}
          </span>
        )}
      </Button>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Shopping Cart</SheetTitle>
        </SheetHeader>
        <CartPreview onClose={() => onOpenChange(false)} />
      </SheetContent>
    </Sheet>
  );
};

export default CartButton;
