
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useCart } from "@/contexts/CartContext";

const CartFooter = ({ className }: { className?: string }) => {
  const { state } = useCart();
  const { currency, convertPrice } = useCurrency();
  const navigate = useNavigate();
  const location = useLocation();
  
  const isProductsPage = location.pathname === "/products";
  const hasItems = state.items.length > 0;
  const total = state.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

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
        <span className="font-bold">{currency.symbol}{convertPrice(total).toFixed(2)}</span>
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
};

export default CartFooter;
