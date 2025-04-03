
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
import { useEffect } from "react";

interface CartButtonProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const CartButton = ({ isOpen, onOpenChange }: CartButtonProps) => {
  const { state: cartState } = useCart();
  const { isAuthenticated } = useAuth();
  const itemCount = cartState.items.reduce((acc, item) => acc + item.quantity, 0);

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
