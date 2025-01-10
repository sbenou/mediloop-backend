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

interface CartButtonProps {
  session: any;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const CartButton = ({ session, isOpen, onOpenChange }: CartButtonProps) => {
  const { state: cartState } = useCart();
  const itemCount = cartState.items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <ShoppingCart className="h-4 w-4" />
          {itemCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {itemCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Shopping Cart</SheetTitle>
        </SheetHeader>
        <CartPreview onClose={() => onOpenChange(false)} session={session} />
      </SheetContent>
    </Sheet>
  );
};

export default CartButton;