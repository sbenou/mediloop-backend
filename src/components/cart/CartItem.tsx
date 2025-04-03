
import React from 'react';
import { Button } from "@/components/ui/button";
import { Minus, Plus, Trash2 } from "lucide-react";
import { CartItem as CartItemType } from "@/types/cart";
import { useCart } from "@/contexts/CartContext";
import { AspectRatio } from "@/components/ui/aspect-ratio";

interface CartItemProps {
  item: CartItemType;
}

export const CartItem: React.FC<CartItemProps> = ({ item }) => {
  const { updateQuantity, removeFromCart } = useCart();
  
  return (
    <div className="flex gap-3 py-3 border-b last:border-b-0">
      {/* Fixed image container with consistent dimensions */}
      <div className="w-16 h-16 flex-shrink-0 rounded overflow-hidden flex items-center justify-center bg-gray-100">
        <AspectRatio ratio={1} className="w-full h-full">
          {item.image_url ? (
            <img
              src={item.image_url}
              alt={item.name}
              className="h-full w-full object-cover"
              onError={(e) => {
                // Fallback to placeholder on error
                e.currentTarget.src = "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&q=80";
              }}
            />
          ) : (
            <img
              src="https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&q=80"
              alt="Product placeholder"
              className="h-full w-full object-cover"
            />
          )}
        </AspectRatio>
      </div>
      
      <div className="flex flex-col justify-between flex-1 min-w-0">
        <div>
          <h4 className="font-medium text-sm line-clamp-1">{item.name}</h4>
          <p className="text-sm text-muted-foreground">${item.price}</p>
        </div>
        
        {/* Updated quantity controls to match the product detail page */}
        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center h-8 border rounded-md">
            <Button
              variant="ghost"
              size="icon"
              className="h-full w-8"
              onClick={() => updateQuantity(item.id, item.quantity - 1)}
              disabled={item.quantity <= 1}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <div className="w-8 text-center text-sm font-medium">
              {item.quantity}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-full w-8"
              onClick={() => updateQuantity(item.id, item.quantity + 1)}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          
          {/* Made delete button more visible */}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 hover:bg-red-50 hover:text-red-500 ml-2"
            onClick={() => removeFromCart(item.id)}
            aria-label="Remove item"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
