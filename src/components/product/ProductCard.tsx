
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { useCart } from "@/contexts/CartContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface Product {
  id: string;
  name: string;
  price: number;
  requires_prescription: boolean;
  type: 'medication' | 'parapharmacy';
  image_url?: string | null;
  description?: string;
}

interface ProductCardProps {
  product: Product;
}

export const ProductCard = ({ product }: ProductCardProps) => {
  const { addToCart } = useCart();
  const { formatCurrency, convertPrice } = useCurrency();
  const [imageError, setImageError] = useState(false);
  const navigate = useNavigate();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent navigation when clicking the button
    
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
      image_url: product.image_url || undefined,
    });

    toast({
      title: "Added to Cart",
      description: `${product.name} has been added to your cart.`,
    });
  };

  const handleImageError = () => {
    console.error('Image failed to load:', product.image_url);
    setImageError(true);
  };

  const handleCardClick = () => {
    console.log('Card clicked! Navigating to product detail:', product.id);
    navigate(`/products/${product.id}`);
  };

  const placeholderImages = [
    'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae',
    'https://images.unsplash.com/photo-1587854692152-cbe660dbde88',
    'https://images.unsplash.com/photo-1577401132921-cb39bb0adcff',
    'https://images.unsplash.com/photo-1556229162-5c63ed9c4efb'
  ];

  const getPlaceholderImage = () => {
    const index = product.id.charCodeAt(0) % placeholderImages.length;
    return `${placeholderImages[index]}?w=400&q=80`;
  };

  const displayPrice = formatCurrency(convertPrice(product.price));

  return (
    <Card 
      className="overflow-hidden flex flex-col cursor-pointer hover:shadow-md transition-shadow duration-200"
      onClick={handleCardClick}
    >
      <div 
        className="aspect-square relative overflow-hidden bg-gray-100"
        onClick={handleCardClick}
      >
        <img
          src={imageError || !product.image_url ? getPlaceholderImage() : product.image_url}
          alt={product.name}
          className="object-cover w-full h-full hover:scale-105 transition-transform duration-200"
          onError={handleImageError}
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      </div>
      <CardHeader>
        <CardTitle className="text-lg line-clamp-2">{product.name}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-between">
        {product.description && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {product.description}
          </p>
        )}
        <div className="flex justify-between items-center mt-auto">
          <span className="font-medium">{displayPrice}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddToCart}
            className="flex items-center gap-2"
          >
            <ShoppingCart className="h-4 w-4" />
            <span>Add to Cart</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
