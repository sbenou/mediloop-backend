
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useCart } from "@/contexts/CartContext";

export default function CartFooter({ className }: { className?: string }) {
  const { items, total } = useCart();
  const { formatCurrency } = useCurrency();
  const navigate = useNavigate();
  const location = useLocation();
  
  const isProductsPage = location.pathname === "/products";
  const hasItems = items.length > 0;

  const handleStartShopping = () => {
    navigate("/products");
  };

  const handleCheckout = () => {
    navigate("/checkout");
  };

  if (!hasItems) {
    return (
      <div className={`p-4 border-t ${className}`}>
        <Button 
          onClick={handleStartShopping} 
          className="w-full"
        >
          Start Shopping
        </Button>
      </div>
    );
  }

  return (
    <div className={`p-4 border-t ${className}`}>
      <div className="flex justify-between mb-4">
        <span className="font-medium">Total</span>
        <span className="font-bold">{formatCurrency(total)}</span>
      </div>
      
      <div className="space-y-2">
        <Button 
          onClick={handleCheckout} 
          className="w-full"
        >
          Checkout
        </Button>
        
        {!isProductsPage && (
          <Button 
            onClick={handleStartShopping} 
            variant="outline" 
            className="w-full"
          >
            Start Shopping
          </Button>
        )}
      </div>
    </div>
  );
}
