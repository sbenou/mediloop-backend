import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { CartPreview } from "@/components/CartPreview";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/hooks/auth/useAuth";
import { useCurrency } from "@/contexts/CurrencyContext";

interface CartButtonProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const CartButton = ({ isOpen, onOpenChange }: CartButtonProps) => {
  const { state: cartState } = useCart();
  const { currency, convertPrice } = useCurrency();
  const { isAuthenticated } = useAuth();
  
  const itemCount = cartState.items.reduce((acc, item) => acc + item.quantity, 0);
  const total = cartState.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const convertedTotal = convertPrice(total);

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <ShoppingCart className="h-4 w-4" />
          <div className="absolute -top-3 -right-3 flex flex-col items-center">
            {itemCount > 0 && (
              <span className="bg-[#7E69AB] text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {itemCount}
              </span>
            )}
            {total > 0 && (
              <span className="text-xs font-medium whitespace-nowrap">
                {currency.symbol}{convertedTotal.toFixed(2)}
              </span>
            )}
          </div>
        </Button>
      </SheetTrigger>
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