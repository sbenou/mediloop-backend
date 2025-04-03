
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
    <div className="flex gap-3 py-3 w-full">
      <div className="w-16 h-16 flex-shrink-0 rounded overflow-hidden">
        <AspectRatio ratio={1} className="bg-gray-100">
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
      
      <div className="flex flex-col flex-1 min-w-0">
        <h4 className="font-medium text-sm line-clamp-1">{item.name}</h4>
        <p className="text-sm text-muted-foreground">${item.price}</p>
        
        <div className="flex items-center justify-between mt-auto pt-1">
          <div className="flex items-center">
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() => updateQuantity(item.id, item.quantity - 1)}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <span className="w-8 text-center text-sm">{item.quantity}</span>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() => updateQuantity(item.id, item.quantity + 1)}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7 ml-2"
            onClick={() => removeFromCart(item.id)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
};
