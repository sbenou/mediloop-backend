
import React from 'react';
import { Button } from "@/components/ui/button";
import { Minus, Plus, Trash2 } from "lucide-react";
import { CartItem as CartItemType, BoostCartItem, PlanCartItem } from "@/types/cart";
import { useCart } from "@/contexts/CartContext";
import { AspectRatio } from "@/components/ui/aspect-ratio";

interface CartItemProps {
  item: CartItemType | BoostCartItem | PlanCartItem;
}

export const CartItem: React.FC<CartItemProps> = ({ item }) => {
  const { updateQuantity, removeFromCart } = useCart();
  
  // Determine if this is a regular product item (with quantity)
  const isProductItem = 'quantity' in item;
  
  // Determine item type for special display
  const isPlan = 'type' in item && item.type === 'plan';
  const isBoost = 'type' in item && item.type === 'boost';
  
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
          
          {/* Show special item details */}
          {isPlan && (
            <p className="text-xs text-muted-foreground mt-1">
              {(item as PlanCartItem).interval} plan
            </p>
          )}
          
          {isBoost && (
            <p className="text-xs text-muted-foreground mt-1">
              {(item as BoostCartItem).boost_type}, {(item as BoostCartItem).duration}
            </p>
          )}
        </div>
        
        <div className="flex items-center justify-between mt-1">
          {isProductItem ? (
            // Quantity controls for regular products
            <div className="flex items-center h-8 border rounded-md">
              <Button
                variant="ghost"
                size="icon"
                className="h-full w-8"
                onClick={() => updateQuantity(item.id, (item as CartItemType).quantity - 1)}
                disabled={(item as CartItemType).quantity <= 1}
              >
                <Minus className="h-3 w-3" />
              </Button>
              <div className="w-8 text-center text-sm font-medium">
                {(item as CartItemType).quantity}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-full w-8"
                onClick={() => updateQuantity(item.id, (item as CartItemType).quantity + 1)}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            // For non-quantity items, just show a badge or similar
            <div className="text-xs text-primary font-medium bg-primary/10 px-2 py-1 rounded">
              {isPlan ? 'Subscription' : 'One-time'}
            </div>
          )}
          
          {/* Delete button */}
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
