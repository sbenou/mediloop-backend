import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { useCart } from "@/contexts/CartContext";

interface Product {
  id: string;
  name: string;
  price: number;
  requires_prescription: boolean;
  type: 'medication' | 'parapharmacy';
  image_url?: string;
  description?: string;
}

interface ProductCardProps {
  product: Product;
}

export const ProductCard = ({ product }: ProductCardProps) => {
  const { addToCart } = useCart();

  const handleAddToCart = () => {
    if (product.requires_prescription) {
      toast({
        variant: "destructive",
        title: "Permission Denied",
        description: "This product requires a prescription and cannot be added to cart.",
      });
      return;
    }
    
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image_url: product.image_url,
    });

    toast({
      title: "Added to Cart",
      description: `${product.name} has been added to your cart.`,
    });
  };

  return (
    <Card>
      {product.image_url && (
        <div className="aspect-square relative overflow-hidden">
          <img
            src={product.image_url}
            alt={product.name}
            className="object-cover w-full h-full"
          />
        </div>
      )}
      <CardHeader>
        <CardTitle className="text-lg">{product.name}</CardTitle>
      </CardHeader>
      <CardContent>
        {product.description && (
          <p className="text-sm text-muted-foreground mb-4">{product.description}</p>
        )}
        <div className="flex justify-between items-center">
          <span className="font-medium">${product.price}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddToCart}
            className="flex items-center space-x-2"
          >
            <ShoppingCart className="h-4 w-4" />
            <span>Add to Cart</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};