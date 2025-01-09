import { ShoppingCart } from "lucide-react";

export const CartEmpty = () => {
  return (
    <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
      <ShoppingCart className="h-12 w-12 mb-4" />
      <p>Your cart is empty</p>
    </div>
  );
};