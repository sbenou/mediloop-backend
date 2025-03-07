
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useLocation, useNavigate } from "react-router-dom";

interface CartFooterProps {
  total: number;
  comment: string;
  onCommentChange: (comment: string) => void;
  onCheckout: () => void;
  onClose: () => void;
  isProcessing: boolean;
}

export const CartFooter = ({
  total,
  comment,
  onCommentChange,
  onCheckout,
  onClose,
  isProcessing,
}: CartFooterProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isProductsPage = location.pathname === '/products';
  
  const handleStartShopping = () => {
    navigate('/products');
    onClose();
  };
  
  return (
    <div className="space-y-4 border-t pt-4 mt-4">
      <Textarea
        placeholder="Add a comment to your order..."
        value={comment}
        onChange={(e) => onCommentChange(e.target.value)}
        className="min-h-[100px]"
      />
      
      <div className="flex justify-between mb-4">
        <span className="font-medium">Total</span>
        <span className="font-medium">${total.toFixed(2)}</span>
      </div>
      
      <div className="space-y-2 pb-4">
        <Button 
          className="w-full" 
          onClick={onCheckout}
          disabled={isProcessing}
        >
          {isProcessing ? "Processing..." : "Proceed to Checkout"}
        </Button>
        
        {!isProductsPage && (
          <Button 
            variant="outline" 
            className="w-full"
            onClick={handleStartShopping}
          >
            Start Shopping
          </Button>
        )}
        
        {isProductsPage && (
          <Button 
            variant="outline" 
            className="w-full"
            onClick={onClose}
          >
            Keep Shopping
          </Button>
        )}
      </div>
    </div>
  );
};
